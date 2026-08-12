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
 * Domain — English status labels (mirror of §11.4; chrome copy,
 * §7.6). The single label surface for §49.4 and the §46.13 badge —
 * one occurrence per string (§48.6).
 * @type {readonly Object<string, string>}
 */
export const REPORT_STATUS_LABELS = Object.freeze({
  draft: 'Draft',
  audio_attached: 'Audio attached',
  transcribed: 'Transcribed',
  reviewed: 'Reviewed',
  completed: 'Completed',
});

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

/**
 * Toast — the §60.6 catalogue, single-sourced (one occurrence per
 * string). Chrome copy in English (§7.6). The `{query}` placeholder
 * is substituted by callers at trigger time.
 * @type {readonly Object<string, readonly Object<string, string>>}
 */
export const TOAST_CATALOGUE = Object.freeze({
  report: Object.freeze({
    created: 'Report created',
    completed: 'Report completed',
    archived: 'Report archived',
    restored: 'Report restored',
    deleted: 'Report deleted',
  }),
  branch: Object.freeze({
    created: 'Branch created',
    updated: 'Branch updated',
    archived: 'Branch archived — reports keep their data',
    restored: 'Branch restored',
    deleted: 'Branch deleted — it will be removed after the retention period',
  }),
  clip: Object.freeze({ deleted: 'Clip deleted' }),
  transcription: Object.freeze({ ready: 'Transcription ready' }),
  generation: Object.freeze({ ready: 'Report generated — please review' }),
  correction: Object.freeze({ accepted: 'Correction accepted', reverted: 'Correction reverted' }),
  export: Object.freeze({ ready: 'Export ready' }),
  auth: Object.freeze({
    loggedOut: 'You have been logged out',
    loggedIn: 'Welcome back',
    accountCreated: 'Account created — please log in',
  }),
  session: Object.freeze({ ended: 'Session ended' }),
  error: Object.freeze({
    generic: 'Something went wrong — please try again',
    offline: 'You appear to be offline',
  }),
  search: Object.freeze({ noResults: 'No results for "{query}"' }),
});

/**
 * Avatar upload constraints (mirror of §11.3, §29 chain).
 * @type {number}
 */
export const AVATAR_MAX_SIZE_BYTES = 5242880;

/**
 * @type {readonly string[]}
 */
export const AVATAR_ALLOWED_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/**
 * Domain — the official-text token prefix (mirror of §11.3
 * `OFFICIAL_TOKEN_PREFIX`): marks entitled text the user must not
 * freely alias (§35.3). The client renders `±` strings verbatim —
 * never resolves, strips, or translates them (resolution is
 * server-side at export, §37/§64).
 * @type {string}
 */
export const OFFICIAL_TOKEN_PREFIX = '±';

/**
 * Toast — auto-dismiss durations in ms (§60.5: success 5s, error and
 * warning 8s; info follows the success cadence; loading never
 * auto-dismisses — the caller dismisses it on completion).
 * @type {readonly Object<string, number>}
 */
export const TOAST_AUTO_DISMISS_MS = Object.freeze({
  success: 5000,
  info: 5000,
  error: 8000,
  warning: 8000,
});