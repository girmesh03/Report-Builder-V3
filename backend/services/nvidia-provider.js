/**
 * @module services/nvidia-provider
 *
 * The NVIDIA NIM adapter (§16.4, ADR-008 — axios): `POST
 * {NVIDIA_API_URL}/chat/completions` (the §10.4 Required base URL —
 * the official documented value `https://integrate.api.nvidia.com/v1`
 * lives in `backend/.env`, never in source) with the §16.4 body —
 * `model` from the registered `AI_MODELS.nvidia` entry (never an
 * inline literal), `messages`, `temperature`/`max_tokens` (the
 * §11.3 knobs), the fixed `response_format: { type: 'json_object' }`
 * structured-output knob, and reasoning via the reliable
 * `chat_template_kwargs` transport (the §16.4 translation: `off →
 * { thinking: false }`, `low → low`, `medium → high` — DeepSeek
 * documents no native medium — `high → high`). The Bearer key is
 * never logged (ADR-019). Response normalized to `{ text, model }`
 * from `choices[0].message.content`; `reasoning_content` is never
 * surfaced (§9.5) and never stored (§36).
 *
 * Note (owner directive, 2026-08-20): the adapter is implemented to
 * the §16.4 contract but is exercised **only statically** — no live
 * NVIDIA call exists in the verification suites (the registered id
 * `deepseek flash 4` stays a §16.8 deployment-time catalog-
 * validation item at build.nvidia.com).
 */
import axios from 'axios';
import { env } from '../config/env.js';

/**
 * The §16.4 reasoning translation for DeepSeek/NIM — `off` disables
 * thinking, `medium` maps to `high` (DeepSeek documents no native
 * medium).
 * @param {string} effort - The app-level effort (`off`/`low`/`medium`/`high`).
 * @returns {{ thinking: boolean, reasoning_effort?: string }} The NIM kwargs.
 */
export function translateReasoning(effort) {
  if (effort === 'off') return { thinking: false };
  return { thinking: true, reasoning_effort: effort === 'medium' ? 'high' : effort };
}

/**
 * Runs one NVIDIA text-generation call (§16.4).
 * @param {{ model: string, system: string, messages: Array<{role: string, content: string}>, temperature: number, maxTokens: number, json: boolean, reasoning: string|null }} request - The §34/§35 request (`json` true when a schema was requested — the §16.4 fixed `response_format` knob rides only then; the plain-prose carve-out sends none).
 * @returns {Promise<{ text: string, model: string }>}
 * @throws {Error} With `providerFailure` attached — the chain classifies by status.
 */
export async function completeText({ model, system, messages, temperature, maxTokens, json, reasoning }) {
  const body = {
    model,
    messages: [{ role: 'system', content: system }, ...messages],
    temperature,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
    ...(reasoning ? { chat_template_kwargs: translateReasoning(reasoning) } : {}),
  };

  let response;
  try {
    response = await axios.post(
      `${env.NVIDIA_API_URL}/chat/completions`,
      body,
      {
        headers: { Authorization: `Bearer ${env.NVIDIA_API_KEY}` },
        timeout: Number(env.AI_TIMEOUT_MS),
      },
    );
  } catch (err) {
    const status = err?.response?.status;
    throw Object.assign(new Error('nvidia TTT failed'), {
      providerFailure:
        typeof status === 'number' && status >= 400 && status < 500
          ? { kind: 'permanent' }
          : { kind: 'retryable' },
      raw: err,
    });
  }

  const text = response?.data?.choices?.[0]?.message?.content ?? '';
  if (!text) {
    throw Object.assign(new Error('nvidia empty response'), { providerFailure: { kind: 'retryable' } });
  }
  return { text, model };
}