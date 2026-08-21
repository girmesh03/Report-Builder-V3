/**
 * @module utils/constants
 *
 * Backend constants inventory (§11.3) and domain constants (§11.4) —
 * the canonical homes for every non-environment literal. No magic
 * values anywhere: every literal used by the §9.1 rules resolves here
 * or to §10. Compound values are frozen on export; mutation of
 * imported constants is forbidden (§11.2).
 */

/**
 * Audio upload constraints — §32, §53.
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
 * Pagination defaults — §30.
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
 * Addis AI STT per-request duration cap — §33.
 * @type {number}
 */
export const ADDIS_AI_STT_MAX_DURATION_SEC = 60;

/**
 * Identity & media rules — §28, §29.
 * @type {number}
 */
export const BCRYPT_SALT_ROUNDS = 12;

/**
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
 * @type {number}
 */
export const ACCESS_TOKEN_TTL_MIN = 15;

/**
 * @type {number}
 */
export const REFRESH_TOKEN_TTL_DAYS = 7;

/**
 * AI text-generation parameters — §34.
 * @type {number}
 */
export const AI_TEMPERATURE = 0.2;

/**
 * @type {number}
 */
export const AI_MAX_OUTPUT_TOKENS = 2048;

/**
 * @type {number}
 */
export const AI_TOP_P = 0.9;

/**
 * @type {number}
 */
export const AI_TOP_K = 40;

/**
 * AI correction parameters — §35.
 * @type {number}
 */
export const AI_CORRECTION_MAX_OUTPUT_TOKENS = 2048;

/**
 * @type {number}
 */
export const AI_CORRECTION_TEMPERATURE = 0.15;

/**
 * Chat & conversation limits — §34, §36.
 * @type {number}
 */
export const AI_CONVERSATION_HISTORY_MAX_ENTRIES = 20;

/**
 * @type {number}
 */
export const CHAT_MESSAGE_MAX_LENGTH = 4000;

/**
 * @type {boolean}
 */
export const EXPORT_DOCS_ENABLED = false;

/**
 * Provider retry policy — §16.
 * @type {number}
 */
export const AI_PROVIDER_RETRIES = 3;

/**
 * @type {number}
 */
export const AI_PROVIDER_BACKOFF_BASE_MS = 1000;

/**
 * MongoDB duplicate-key error code — §27 (error-envelope mapping).
 * @type {number}
 */
export const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

/**
 * MongoDB connection timeout for boot fail-fast — §26.6. Budgets a
 * cold Atlas TLS + replica-set discovery handshake (the §10.4
 * MONGO_URI is a cloud URI); still fail-fast vs the 30 s driver
 * default.
 * @type {number}
 */
export const MONGO_CONNECT_TIMEOUT_MS = 10000;

/**
 * Boot retry backoff (§26.6, D53) — the initial connection is
 * retried with exponential delay before the fail-fast exit:
 * first wait, doubling per attempt, capped; after
 * `DB_RETRY_MAX_ATTEMPTS` consecutive failures boot exits 1.
 * Rides out transient Atlas/DNS blips (~18–20 s recovery observed)
 * while keeping a broken deploy visibly crashed (≈4–5 min worst
 * case including each attempt's own selection-timeout cost). Initial-connect scope only — post-connect drops stay on
 * the driver's auto-reconnect.
 * @type {number}
 */
export const DB_RETRY_INITIAL_MS = 1000;

/** Backoff ceiling — §26.6/D53. @type {number} */
export const DB_RETRY_MAX_MS = 30000;

/** Consecutive failed attempts before the fail-fast exit — §26.6/D53. @type {number} */
export const DB_RETRY_MAX_ATTEMPTS = 10;

/**
 * Provider base URL — §16 (gemini/nvidia only; the addisai SDK is
 * SDK-internal — no `ADDIS_AI_BASE_URL` constant exists, §16.7).
 * @type {string}
 */
export const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Rate-limit tiers — §27.
 * @type {number}
 */
export const RATE_LIMIT_GLOBAL_WINDOW_MIN = 15;

/**
 * @type {number}
 */
export const RATE_LIMIT_GLOBAL_MAX = 100;

/**
 * @type {number}
 */
export const RATE_LIMIT_AUTH_WINDOW_MIN = 15;

/**
 * @type {number}
 */
export const RATE_LIMIT_AUTH_MAX = 20;

/**
 * @type {number}
 */
export const RATE_LIMIT_AI_WINDOW_MIN = 1;

/**
 * @type {number}
 */
export const RATE_LIMIT_AI_MAX = 10;

/**
 * Retention & sweeper — §31, §62.
 * @type {number}
 */
export const ARCHIVED_TTL_SECONDS = 2592000;

/**
 * @type {number}
 */
export const LOG_RETENTION_DAYS = 30;

/**
 * @type {number}
 */
export const SWEEPER_INTERVAL_MS = 3600000;

/**
 * Official-token marker — §35, §37, §53, §58, §64.
 * @type {string}
 */
export const OFFICIAL_TOKEN_PREFIX = '±';

/**
 * Domain — report state machine (§5, §31, §51).
 * @type {readonly string[]}
 */
export const REPORT_STATUSES = Object.freeze([
  'draft',
  'audio_attached',
  'transcribed',
  'generated',
]);

/**
 * Domain — item types (§24A, §34, §38).
 * @type {readonly string[]}
 */
export const ITEM_TYPES = Object.freeze(['activity', 'issue', 'comment']);

/**
 * Domain — item statuses (§24A, §54).
 * @type {readonly string[]}
 */
export const ITEM_STATUSES = Object.freeze([
  'reported',
  'in_progress',
  'completed',
]);

/**
 * Domain — per-type item status vocabulary (§24A, §54).
 * @type {readonly Object<string, readonly string[]>}
 */
export const ITEM_STATUSES_BY_TYPE = Object.freeze({
  activity: Object.freeze(['completed', 'in_progress']),
  issue: Object.freeze(['reported', 'in_progress', 'completed']),
  comment: Object.freeze([]),
});

/**
 * Domain — provider ids, also the §16.6 fallback chain order.
 * @type {readonly string[]}
 */
export const AI_PROVIDERS = Object.freeze(['addis', 'gemini', 'nvidia']);

/**
 * Domain — active language codes; `om`/`ti` reserved, not activated.
 * @type {readonly Object<string, string>}
 */
export const LANGUAGE_CODES = Object.freeze({ am: 'am', en: 'en' });

/**
 * Domain — a selectable model entry (§16.2).
 * @typedef {Object} ModelEntry
 * @property {string} id - Provider-native model id.
 * @property {boolean} default - True for the provider's default model.
 * @property {boolean} reasoning - True when the model supports reasoning efforts.
 */

/**
 * Domain — per-provider model registry (§11.4, §16.2).
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
 * Domain — reasoning effort levels (sent only for `reasoning: true`
 * models; `off` maps per provider, §16.2).
 * @type {readonly string[]}
 */
export const AI_REASONING_EFFORTS = Object.freeze(['off', 'low', 'medium', 'high']);

/**
 * Domain — the conversation-level standing reasoning effort applied
 * to every TTT request (§16.2, §24.2).
 * @type {string}
 */
export const AI_REASONING_DEFAULT = 'off';

/**
 * Domain — conversation message roles (§24, §36).
 * @type {readonly string[]}
 */
export const MESSAGE_ROLES = Object.freeze(['system', 'user', 'assistant']);