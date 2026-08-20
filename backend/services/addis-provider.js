/**
 * @module services/addis-provider
 *
 * The addisai SDK adapter (§16.3/§16.7, ADR-008) — the **only
 * module that calls the SDK instance** built in `config/env.js`
 * (the SDK constructor is touched nowhere else; grep gate §16.8).
 * Two surfaces: `transcribeChunk` (STT — §33.4, exclusively addis,
 * ADR-001) and `completeText` (TTT — §16.4 call shape:
 * `chat.completions.create({ language: 'am', system, messages,
 * temperature, max_tokens })`; no `model`/`persona`/`topP`/`topK`
 * — the registry id for addis is display metadata only, never a
 * wire value). JSON mode (generation/report corrections) arrives
 * through the prompt instruction; `extractJson` strips code fences
 * and parses — the contract step before the §16.5 parse-failure
 * policy. Error mapping: SDK typed errors (402 insufficient
 * credits → fallback-allowed with the top-up copy; 429 → the
 * SDK's `.retryAfter` honored under the bounded schedule) and
 * plain failures. Logging is provider/model/status/timing only —
 * never keys, never message bodies, never response text (ADR-019).
 */
import { fileFromPath } from 'addisai';
import { addisai } from '../config/env.js';

/**
 * Classifies an SDK failure for the §16.5/§16.6 policy.
 * @typedef {Object} ProviderFailure
 * @property {string} kind - `'retryable'` | `'permanent'` | `'insufficient_credits'` | `'rate_limited'`.
 * @property {number} [retryAfter] - Seconds to wait (rate_limited only, capped by the chain).
 * @property {string} [topUpMessage] - The 402 user-facing copy (insufficient_credits only).
 */

/** The §16.5 402 top-up copy — surfaced through the 502 envelope. */
const TOP_UP_MESSAGE = 'Insufficient AI credits — top up the Addis account';

/**
 * Maps an SDK error to the classification policy (§16.5).
 * @param {unknown} err - The raised error.
 * @returns {ProviderFailure}
 */
export function classifyAddisError(err) {
  const name = err?.name ?? '';
  if (name === 'InsufficientCreditsError') {
    return { kind: 'insufficient_credits', topUpMessage: TOP_UP_MESSAGE };
  }
  if (name === 'RateLimitError') {
    const retryAfter = Number.isFinite(Number(err?.retryAfter)) ? Number(err.retryAfter) : undefined;
    return { kind: 'rate_limited', retryAfter };
  }
  const status = err?.status ?? err?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500 && status !== 429) {
    return { kind: 'permanent' };
  }
  return { kind: 'retryable' };
}

/**
 * Transcribes one PCM wav chunk (§33.4): `speech.transcribe({ audio,
 * language })` — the SDK sends multipart `audio` + `request_data`
 * `{ language_code }` (exactly one field, §16.4). Returns the
 * normalized result with the §16.4 request-id (from
 * `usage_metadata.requestId`) and the voice-model echo
 * (null-if-unknown, §23.2).
 * @param {string} chunkPath - The §33.3 pipeline chunk (mono 16-bit 16 kHz wav).
 * @param {string} language - The transcription language code (`am` today, §7.7).
 * @returns {Promise<{ text: string, confidence: number|null, requestId: string|null, model: string|null }>}
 * @throws {ProviderFailure} On SDK failure — the caller (stt.service) classifies per chunk.
 */
export async function transcribeChunk(chunkPath, language) {
  let result;
  try {
    result = await addisai.speech.transcribe({
      audio: await fileFromPath(chunkPath),
      language,
    });
  } catch (err) {
    throw Object.assign(new Error('addis STT failed'), {
      providerFailure: classifyAddisError(err),
      raw: err,
    });
  }
  const usage = result?.usage ?? null;
  return {
    text: result?.text ?? '',
    confidence: result?.confidence ?? null,
    requestId: usage?.requestId ?? null,
    model: result?.model ?? null,
  };
}

/**
 * Runs one addis text-generation call (§16.4). The installed SDK
 * surfaces the OpenAI-style `ChatCompletion` (`choices[0].message.
 * content` — verified 2026-08-20; the spec's §16.4 "SDK-normalized"
 * `{ text, finish_reason }` shape describes a surface the shipped
 * SDK does not expose — recorded in §16.4 and §69), so the adapter
 * maps here. `finish_reason` `length`/`content_filter` surface as
 * retryable failures (G6 — never silently accepted); `stop` is
 * success.
 * @param {{ system: string, messages: Array<{role: string, content: string}>, temperature: number, maxTokens: number }} request - The §34/§35 request.
 * @returns {Promise<{ text: string, model: string|null, finishReason: string|null, usage: object|null }>}
 * @throws {Error} With `providerFailure` attached — the chain classifies.
 */
export async function completeText({ system, messages, temperature, maxTokens }) {
  let result;
  try {
    result = await addisai.chat.completions.create({
      language: 'am',
      system,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
  } catch (err) {
    throw Object.assign(new Error('addis TTT failed'), {
      providerFailure: classifyAddisError(err),
      raw: err,
    });
  }
  const text = result?.choices?.[0]?.message?.content ?? '';
  const finishReason = result?.choices?.[0]?.finish_reason ?? null;
  if (finishReason === 'length' || finishReason === 'content_filter') {
    throw Object.assign(new Error(`addis finish_reason ${finishReason}`), {
      providerFailure: { kind: 'retryable' },
    });
  }
  return {
    text,
    model: result?.model ?? null,
    finishReason,
    usage: result?.usage ?? null,
  };
}

/**
 * Extracts JSON from a provider text response (§16.4 — Addis has no
 * response-format knob; JSON mode arrives through the prompt): code
 * fences and surrounding prose are stripped, then parsed. A
 * non-parsable payload is a provider failure (retry → fallback,
 * §16.5) — never silently accepted.
 * @param {string} text - The provider response text.
 * @returns {object|null} The parsed JSON, or null when extraction fails.
 */
export function extractJson(text) {
  if (typeof text !== 'string') return null;
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Addis never receives a reasoning parameter (§16.4) — no translation exists. */
export function translateReasoning() {
  return undefined;
}