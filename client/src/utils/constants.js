/**
 * @module utils/constants
 *
 * Client constants inventory (§11.5) — mirrors the shared business
 * sets consumed by the UI. Freeze rules are identical to the backend
 * (§11.2): compound values are frozen on export, mutation of imported
 * constants is forbidden.
 */

/**
 * Domain — report state machine (mirror of §11.4).
 * @type {readonly string[]}
 */
export const REPORT_STATUSES = Object.freeze([
  'draft',
  'audio_attached',
  'transcribed',
  'reviewed',
  'completed',
]);

/**
 * Domain — provider ids (mirror of §11.4).
 * @type {readonly string[]}
 */
export const AI_PROVIDERS = Object.freeze(['addis', 'gemini', 'nvidia']);

/**
 * Domain — a selectable model entry (mirror of §11.4, §16.2).
 * @typedef {Object} ModelEntry
 * @property {string} id - Provider-native model id.
 * @property {boolean} default - True for the provider's default model.
 * @property {boolean} reasoning - True when the model supports reasoning efforts.
 */

/**
 * Domain — per-provider model registry (mirror of §11.4).
 * @type {readonly Object<string, readonly ModelEntry[]>}
 */
export const AI_MODELS = Object.freeze({
  addis: Object.freeze([
    Object.freeze({ id: 'Addis-፩-አሌፍ', default: true, reasoning: false }),
  ]),
  gemini: Object.freeze([
    Object.freeze({ id: 'gemini-3.1-flash-lite', default: true, reasoning: true }),
  ]),
  nvidia: Object.freeze([
    Object.freeze({ id: 'deepseek flash 4', default: true, reasoning: true }),
  ]),
});

/**
 * Domain — reasoning effort levels (mirror of §11.4).
 * @type {readonly string[]}
 */
export const AI_REASONING_EFFORTS = Object.freeze(['off', 'low', 'medium', 'high']);

/**
 * Pagination defaults (mirror of §11.3).
 * @type {number}
 */
export const PAGINATION_DEFAULT_PAGE = 1;

/**
 * @type {number}
 */
export const PAGINATION_DEFAULT_LIMIT = 10;

/**
 * @type {number}
 */
export const PAGINATION_MAX_LIMIT = 100;

/**
 * Audio upload constraints (mirror of §11.3).
 * @type {number}
 */
export const AUDIO_MAX_DURATION_SEC = 900;

/**
 * @type {number}
 */
export const AUDIO_MAX_SIZE_BYTES = 52428800;

/**
 * @type {readonly string[]}
 */
export const AUDIO_ALLOWED_MIME_TYPES = Object.freeze([
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/webm',
]);