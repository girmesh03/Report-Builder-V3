/**
 * @module config/env
 *
 * The only file that reads `process.env` (§10.3, §26.2). Exports a
 * frozen `env` object exposing exactly the §10.4 variables, resolved
 * through the §10.3 lookup chain: live process environment → .env
 * files (backend/.env, then client/.env) → §10.4 default → fail-fast.
 * A Required variable missing from every location throws at import,
 * aborting boot.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import AddisAI from 'addisai';
import { AI_PROVIDER_RETRIES } from '../utils/constants.js';

const configDir = dirname(fileURLToPath(import.meta.url));
const backendEnvPath = join(configDir, '..', '.env');
const clientEnvPath = join(configDir, '..', '..', 'client', '.env');

/**
 * The §10.4 environment-variable inventory.
 * @typedef {Object} EnvSpec
 * @property {string} [default] - Fallback value when the variable is absent everywhere.
 * @property {boolean} [required] - True when absence must fail fast at boot.
 */

/**
 * §10.4 variables with defaults; a missing `required` marker means the
 * entry carries a `default` instead.
 * @type {Object<string, EnvSpec>}
 */
const ENV_SPEC = {
  NODE_ENV: { default: 'development' },
  PORT: { default: '4000' },
  MONGO_URI: { required: true },
  CLIENT_ORIGIN: { default: 'http://localhost:3000' },
  JWT_ACCESS_SECRET: { required: true },
  JWT_REFRESH_SECRET: { required: true },
  ADDIS_API_KEY: { required: true },
  GEMINI_API_KEY: { required: true },
  NVIDIA_API_KEY: { required: true },
  NVIDIA_API_URL: { required: true },
  AI_TIMEOUT_MS: { default: '30000' },
  FFMPEG_PATH: { default: 'ffmpeg' },
  FFPROBE_PATH: { default: 'ffprobe' },
};

/**
 * Reads a single key from a literal `.env` file (dotenv.parse syntax).
 * @param {string} envFilePath - Absolute path of the `.env` file.
 * @param {string} key - Variable name to search.
 * @returns {string|undefined} The raw value, or undefined when the file
 *   is unreadable or the key is absent.
 */
function readFromEnvFile(envFilePath, key) {
  try {
    const parsed = dotenv.parse(readFileSync(envFilePath, 'utf8'));
    return parsed[key];
  } catch {
    return undefined;
  }
}

/**
 * Builds the validated environment object per §10.3: process
 * environment (which includes backend/.env via dotenv) → client/.env →
 * default → fail-fast.
 * @returns {Object<string, string>} Resolved values for every §10.4 key.
 * @throws {Error} When any Required variable is missing from every
 *   location (fail-fast, §26.2).
 */
function buildEnv() {
  dotenv.config({ path: backendEnvPath, quiet: true });

  const missing = [];
  const env = Object.fromEntries(
    Object.entries(ENV_SPEC).map(([key, spec]) => {
      const value = process.env[key] ?? readFromEnvFile(clientEnvPath, key);
      if (value !== undefined && value !== '') {
        return [key, value];
      }
      if (spec.default !== undefined) {
        return [key, spec.default];
      }
      missing.push(key);
      return [key, undefined];
    }),
  );

  if (missing.length > 0) {
    throw new Error(
      `Fail-fast: missing required env variables: ${missing.join(', ')}`,
    );
  }
  return env;
}

/**
 * The frozen configuration object — the only exported surface (§10.3,
 * ADR-020). Mutation attempts fail in strict mode (ESM is strict).
 * @type {Object<string, string>}
 */
export const env = Object.freeze(buildEnv());

/**
 * The single addisai SDK instance (§16.7, S12) — built exactly once
 * here, the only module allowed to construct it (§16.3): `maxRetries`
 * from `AI_PROVIDER_RETRIES` (§11.3), `timeout` from the
 * env-overridable `AI_TIMEOUT_MS` (§10.4). Exported for injection
 * into the §33 STT / §34–§36 provider adapters; no other module
 * reads `ADDIS_API_KEY` or touches the SDK constructor (grep gate
 * §16.8).
 */
export const addisai = new AddisAI({
  apiKey: env.ADDIS_API_KEY,
  maxRetries: AI_PROVIDER_RETRIES,
  timeout: Number(env.AI_TIMEOUT_MS),
});