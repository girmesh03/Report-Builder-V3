/**
 * @module middleware/rateLimit
 *
 * The three rate-limit tiers (ADR-029, §27.3) built from the
 * `RATE_LIMIT_*` constants (§11.3). Every endpoint belongs to exactly
 * one tier: the global limiter is installed in the fixed app chain
 * (§26.4/§27.2) and skips the health endpoint (exempt, §26.6) plus
 * every auth/AI-tier path; the auth and AI limiters are applied
 * per-route by their owning modules (§28, §34–§36). Violations return
 * 429 `TOO_MANY_REQUESTS` through the standard error envelope
 * (ADR-016 shape, §27.5).
 */
import rateLimit from 'express-rate-limit';
import {
  RATE_LIMIT_GLOBAL_WINDOW_MIN,
  RATE_LIMIT_GLOBAL_MAX,
  RATE_LIMIT_AUTH_WINDOW_MIN,
  RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_AI_WINDOW_MIN,
  RATE_LIMIT_AI_MAX,
} from '../utils/constants.js';
import { httpStatus } from '../utils/httpStatus.js';

const TOO_MANY_REQUESTS_BODY = {
  success: false,
  message: 'Too many requests — please wait a moment and try again.',
  data: null,
};

/**
 * Tier-path selection (ADR-029): auth endpoints live under
 * `/api/v1/auth` (§28); AI-tier endpoints are the provider-calling
 * routes — the STT write `PUT /reports/:reportId/transcription`
 * (§33.8 — the only path where the method matters: PUT with a
 * `/transcription` segment), the `POST …/chat/messages` append
 * (§36.7 — **method-aware**: the conversation READ `GET
 * /reports/:reportId/chat` is global tier, §36.3, and must never
 * hit the 10/min AI limiter), and the provider-calling routes
 * whose path carries a `/generations` or `/corrections` segment
 * (§34–§36; no GET endpoints exist on those paths). The health
 * endpoint is exempt (§26.6).
 * @param {string} path - Request path.
 * @param {string} method - Request method (the §33.8 PUT and the
 *   §36.7 POST rules are method-bound).
 * @returns {boolean} True when the path belongs to a non-global tier.
 */
function isTieredPath(path, method) {
  if (path === '/api/v1/health') return true;
  if (path.startsWith('/api/v1/auth')) return true;
  if (method === 'PUT' && /\/transcription(\/|$)/.test(path)) return true;
  if (method === 'POST' && /\/chat\/messages(\/|$)/.test(path)) return true;
  return /(\/generations|\/corrections)(\/|$)/.test(path);
}

/**
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_GLOBAL_WINDOW_MIN * 60 * 1000,
  limit: RATE_LIMIT_GLOBAL_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => isTieredPath(req.path, req.method),
  handler: (req, res) => res.status(httpStatus.TOO_MANY_REQUESTS).json(TOO_MANY_REQUESTS_BODY),
});

/**
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_AUTH_WINDOW_MIN * 60 * 1000,
  limit: RATE_LIMIT_AUTH_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(httpStatus.TOO_MANY_REQUESTS).json(TOO_MANY_REQUESTS_BODY),
});

/**
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const aiLimiter = rateLimit({
  windowMs: RATE_LIMIT_AI_WINDOW_MIN * 60 * 1000,
  limit: RATE_LIMIT_AI_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => res.status(httpStatus.TOO_MANY_REQUESTS).json(TOO_MANY_REQUESTS_BODY),
});