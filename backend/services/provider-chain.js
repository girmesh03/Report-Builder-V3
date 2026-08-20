/**
 * @module services/provider-chain
 *
 * The §16.5/§16.6 fallback engine (ADR-014): the fixed chain
 * `addis → gemini → nvidia` (the `AI_PROVIDERS` order, §11.4) for
 * every text-generation call (initial generation §34, corrections
 * §35, chat replies §36). Per provider: one initial call plus up to
 * `AI_PROVIDER_RETRIES` (3) retries on the exponential
 * `AI_PROVIDER_BACKOFF_BASE_MS` schedule (1 s → 2 s → 4 s) — the
 * retries count is **per provider, not shared** (§12.8) — then
 * fallback to the next provider; all exhausted → the caller
 * surfaces 502 (§27.5). Classification per §16.5: transport/5xx/
 * parse/schema/finish-reason failures retry then fallback; 4xx
 * config faults never retry but still fallback (they recur
 * identically on every provider instance); addis 402 (insufficient
 * credits) falls back with the top-up message; provider 429 honors
 * `Retry-After` under a bounded wait, then is a provider failure.
 * Reasoning rides only where the chosen model has `reasoning: true`
 * (§16.2 — silently omitted elsewhere, never a second fallback);
 * addis never receives one (§16.4). The selected
 * `(provider, model, reasoning)` triple is returned for the §36
 * message audit record. Logging is provider/model/status/timing
 * only (ADR-019) — never keys, never bodies.
 */
import {
  AI_PROVIDERS,
  AI_MODELS,
  AI_PROVIDER_RETRIES,
  AI_PROVIDER_BACKOFF_BASE_MS,
  AI_TOP_P,
  AI_TOP_K,
} from '../utils/constants.js';
import * as addisProvider from './addis-provider.js';
import * as geminiProvider from './gemini-provider.js';
import * as nvidiaProvider from './nvidia-provider.js';
import { logger } from '../utils/logger.js';

/** Bounded 429 wait per retry (the total stays within the app AI tier's window). */
const MAX_RETRY_AFTER_SEC = 15;

/** Bounded total wait per provider attempt sequence. */
const MAX_TOTAL_WAIT_MS = 60000;

const PROVIDERS = {
  addis: addisProvider,
  gemini: geminiProvider,
  nvidia: nvidiaProvider,
};

/** The AI logger child (§26.3, ADR-019 — never secrets/bodies). */
const log = logger.child({ label: 'AI-Chain' });

/**
 * Waits the given milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The chain-exhausted error — the controller maps it to 502
 * (BAD_GATEWAY, §27.5); a 402 top-up message rides along when the
 * last failure was addis insufficient credits (§16.5).
 * @type {Error}
 */
export class ProviderChainExhausted extends Error {
  constructor(topUpMessage) {
    super('All AI providers failed');
    this.name = 'ProviderChainExhausted';
    this.topUpMessage = topUpMessage;
  }
}

/**
 * Resolves the model id for a provider: the caller's stored
 * selection for that provider when given, else the provider's
 * `default` registry entry (§16.6).
 * @param {string} provider - Provider id.
 * @param {object} [modelChoices] - Per-provider user selections (`{ addis?, gemini?, nvidia? }`).
 * @returns {{ id: string, reasoning: boolean }}
 */
function resolveModel(provider, modelChoices) {
  const entries = AI_MODELS[provider] ?? [];
  const chosen = modelChoices?.[provider];
  const entry = (chosen ? entries.find((m) => m.id === chosen) : undefined) ?? entries.find((m) => m.default);
  if (!entry) {
    throw new Error(`No registered model for provider ${provider}`);
  }
  return entry;
}

/**
 * Runs the fixed provider chain for one text-generation request.
 * @param {object} request
 * @param {string} request.kind - Log label — `'generation'` | `'correction'` | `'chat'`.
 * @param {string} request.system - The system/context block (§34.3/§35.2).
 * @param {Array<{role: string, content: string}>} request.messages - The conversation projection + prompt (role/content only, §36.5).
 * @param {object|null} request.schema - The §34.4/§35.4 JSON schema — null for the plain-prose carve-out (§16.4).
 * @param {string|null} request.reasoning - The conversation's standing effort (or override); omitted per provider where unsupported.
 * @param {number} request.temperature - `AI_TEMPERATURE` or `AI_CORRECTION_TEMPERATURE` (§34/§35).
 * @param {number} request.maxTokens - `AI_MAX_OUTPUT_TOKENS` or `AI_CORRECTION_MAX_OUTPUT_TOKENS`.
 * @param {object} [request.modelChoices] - Per-provider user model selections (§36).
 * @param {string} [request.startProvider] - The §35.2 chosen provider — the fixed order
 *   `addis → gemini → nvidia` starts there and wraps (the order itself never changes, §16.6).
 * @param {(parsed: object) => boolean} [request.validate] - The §34/§35 schema validator (JSON paths only); failure = retryable.
 * @returns {Promise<{ provider: string, model: string, reasoning: string|null, text: string, parsed: object|null }>}
 * @throws {ProviderChainExhausted} When every provider fails.
 */
export async function runText({
  kind,
  system,
  messages,
  schema,
  reasoning,
  temperature,
  maxTokens,
  modelChoices,
  startProvider,
  validate,
}) {
  const jsonMode = schema !== null && schema !== undefined;
  let lastTopUp = null;

  const order =
    startProvider && AI_PROVIDERS.includes(startProvider)
      ? [
          ...AI_PROVIDERS.slice(AI_PROVIDERS.indexOf(startProvider)),
          ...AI_PROVIDERS.slice(0, AI_PROVIDERS.indexOf(startProvider)),
        ]
      : AI_PROVIDERS;

  for (const provider of order) {
    const adapter = PROVIDERS[provider];
    const entry = resolveModel(provider, modelChoices);
    const reasoningUsed = entry.reasoning && reasoning ? reasoning : null;
    const startedAt = Date.now();

    for (let attempt = 0; attempt <= AI_PROVIDER_RETRIES; attempt += 1) {
      const attemptStartedAt = Date.now();
      try {
        let text;
        if (provider === 'addis') {
          const res = await adapter.completeText({ system, messages, temperature, maxTokens });
          text = res.text;
        } else {
          const res = await adapter.completeText({
            model: entry.id,
            system,
            messages,
            temperature,
            maxTokens,
            topP: AI_TOP_P,
            topK: AI_TOP_K,
            schema: jsonMode ? schema : null,
            json: jsonMode,
            reasoning: reasoningUsed,
          });
          text = res.text;
        }

        const parsed = jsonMode ? addisProvider.extractJson(text) : null;
        if (jsonMode && parsed === null) {
          log.info({ kind, provider, model: entry.id, status: 'parse_failure', attempt: attempt + 1, ms: Date.now() - attemptStartedAt });
          throw Object.assign(new Error('provider response is not valid JSON'), { providerFailure: { kind: 'retryable' } });
        }
        if (jsonMode && validate && !validate(parsed)) {
          log.info({ kind, provider, model: entry.id, status: 'schema_failure', attempt: attempt + 1, ms: Date.now() - attemptStartedAt });
          throw Object.assign(new Error('provider response fails the schema'), { providerFailure: { kind: 'retryable' } });
        }

        log.info({ kind, provider, model: entry.id, status: 'success', attempt: attempt + 1, ms: Date.now() - attemptStartedAt, totalMs: Date.now() - startedAt });
        return { provider, model: entry.id, reasoning: reasoningUsed, text, parsed };
      } catch (err) {
        const failure = err?.providerFailure ?? { kind: 'retryable' };
        const elapsed = Date.now() - attemptStartedAt;
        log.info({ kind, provider, model: entry.id, status: 'failure', class: failure.kind, attempt: attempt + 1, ms: elapsed });

        if (failure.kind === 'insufficient_credits') {
          lastTopUp = failure.topUpMessage ?? lastTopUp;
          break;
        }
        if (failure.kind === 'permanent') {
          break;
        }
        if (failure.kind === 'rate_limited') {
          const waitSec = Math.min(Number(failure.retryAfter) || 1, MAX_RETRY_AFTER_SEC);
          const waitMs = waitSec * 1000;
          if (Date.now() - startedAt + waitMs <= MAX_TOTAL_WAIT_MS) {
            await sleep(waitMs);
            continue;
          }
          break;
        }

        const backoff = AI_PROVIDER_BACKOFF_BASE_MS * 2 ** attempt;
        if (attempt < AI_PROVIDER_RETRIES) {
          await sleep(Math.min(backoff, MAX_TOTAL_WAIT_MS));
        }
      }
    }
  }

  throw new ProviderChainExhausted(lastTopUp);
}