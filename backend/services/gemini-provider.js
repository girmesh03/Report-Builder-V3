/**
 * @module services/gemini-provider
 *
 * The Google Gemini adapter (§16.4, ADR-008 — axios): `POST
 * {GEMINI_BASE_URL}/models/{registered model id}:generateContent?key=…`
 * with the §16.4 body — `contents` (role `user`/`model` mapping is
 * the adapter's job — no Gemini syntax leaks to the domain),
 * `systemInstruction`, and `generationConfig` carrying
 * `temperature`/`maxOutputTokens`/`topP`/`topK` (the §11.3 knobs —
 * gemini/nvidia only, §16.4), `responseMimeType` + the §34/§35
 * `responseSchema`, and `thinkingConfig.thinkingLevel` — sent only
 * when the registered model has `reasoning: true` (§16.2);
 * translation: `off → minimal` (the Gemini 3 flash family cannot
 * fully disable thinking), else the effort verbatim. The key rides
 * the query parameter (never logged — ADR-019). Response normalized
 * to `{ text, model }` from `candidates[0].content.parts`.
 * Streaming is never requested (D2).
 */
import axios from 'axios';
import { env } from '../config/env.js';
import { GEMINI_BASE_URL } from '../utils/constants.js';

/**
 * The §16.4 reasoning translation for the Gemini family:
 * `off → minimal` (documented floor), else the effort verbatim.
 * @param {string} effort - The app-level effort (`off`/`low`/`medium`/`high`).
 * @returns {string} The Gemini `thinkingLevel`.
 */
export function translateReasoning(effort) {
  return effort === 'off' ? 'minimal' : effort;
}

/**
 * Translates the canonical §34.4/§35.4 schema into the Gemini
 * `responseSchema` dialect: Gemini's proto rejects union `type`
 * lists (`['string', 'null']` → 400 "Proto field is not repeating"),
 * so every union is collapsed to its non-null member (nullable
 * fields are simply optional for the model — the server-side
 * validator still enforces the §34.4 contract).
 * @param {object} schema - The canonical schema (may contain type arrays).
 * @returns {object} A Gemini-compatible schema.
 */
function normalizeSchemaForGemini(schema) {
  if (Array.isArray(schema)) {
    return schema.map(normalizeSchemaForGemini);
  }
  if (schema && typeof schema === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(schema)) {
      if (key === 'type' && Array.isArray(value)) {
        const nonNull = value.filter((t) => t !== 'null');
        out.type = nonNull.length === 1 ? nonNull[0] : 'string';
      } else if (key === 'items' || key === 'properties') {
        out[key] = normalizeSchemaForGemini(value);
      } else if (Array.isArray(value)) {
        out[key] = value.map(normalizeSchemaForGemini);
      } else {
        out[key] = value;
      }
    }
    return out;
  }
  return schema;
}

/**
 * Runs one Gemini text-generation call (§16.4).
 * @param {{ model: string, system: string, messages: Array<{role: string, content: string}>, temperature: number, maxTokens: number, topP: number, topK: number, schema: object|null, reasoning: string|null }} request - The §34/§35 request (schema object from §34.4/§35.4; null → no `responseSchema`).
 * @returns {Promise<{ text: string, model: string }>}
 * @throws {Error} With `providerFailure` attached — the chain classifies by status.
 */
export async function completeText({ model, system, messages, temperature, maxTokens, topP, topK, schema, reasoning }) {
  const generationConfig = {
    temperature,
    maxOutputTokens: maxTokens,
    topP,
    topK,
    // The §16.4 structured-output knobs ride only when JSON was
    // requested (generation + generated-report corrections); the
    // §16.4 plain-prose carve-out (transcription-stage corrections)
    // sends no schema and no JSON mime — no JSON is requested.
    ...(schema
      ? { responseMimeType: 'application/json', responseSchema: normalizeSchemaForGemini(schema) }
      : {}),
    ...(reasoning ? { thinkingConfig: { thinkingLevel: translateReasoning(reasoning) } } : {}),
  };

  let response;
  try {
    response = await axios.post(
      `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        systemInstruction: { parts: [{ text: system }] },
        generationConfig,
      },
      { timeout: Number(env.AI_TIMEOUT_MS) },
    );
  } catch (err) {
    const status = err?.response?.status;
    throw Object.assign(new Error('gemini TTT failed'), {
      providerFailure:
        typeof status === 'number' && status >= 400 && status < 500
          ? { kind: 'permanent' }
          : { kind: 'retryable' },
      raw: err,
    });
  }

  const candidates = response?.data?.candidates ?? [];
  const text = (candidates[0]?.content?.parts ?? [])
    .map((part) => part?.text ?? '')
    .join('');
  if (!text) {
    throw Object.assign(new Error('gemini empty response'), { providerFailure: { kind: 'retryable' } });
  }
  return { text, model };
}