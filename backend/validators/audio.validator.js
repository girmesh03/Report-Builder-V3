/**
 * @module validators/audio
 *
 * The §32 audio-domain rule chains (§29.5 `audio.validator.js`):
 * the multipart upload (`clip` + optional `language` + informational
 * `durationSec`) and the shared param chains. The upload's hard
 * gates — MIME allowlist with the video rejection, the size cap
 * (multer `limits` → 422 mapping), and the ffprobe duration cap —
 * are §32.2 rules enforced by the controller after multer (the
 * file part never reaches the rule chain; §29.3 mounts chains
 * before the controller for JSON bodies only). `language` is
 * validated as a `LANGUAGE_CODES` member and is informational
 * today — the Audio row stores no language field (§22; the STT
 * pipeline language is the transcription's own, defaulting to `am`,
 * §7.7/§23.2).
 */
import { body, param, query } from 'express-validator';
import { LANGUAGE_CODES, PAGINATION_MAX_LIMIT } from '../utils/constants.js';

/** `:audioId` — Mongo ObjectId, else 422 (§29.4). */
const audioIdParam = param('audioId').isMongoId().withMessage('Invalid audio id');

/** `:reportId` — Mongo ObjectId, else 422 (§29.4). */
const reportIdParam = param('reportId').isMongoId().withMessage('Invalid report id');

/**
 * Upload form fields — `language` (default `am`, §32.2) and the
 * informational `durationSec` (the §29 chain enforces the file; the
 * §32.2 cap is ffprobe-enforced in the controller).
 */
const uploadChain = [
  body('language')
    .optional()
    .isIn(Object.values(LANGUAGE_CODES))
    .withMessage('Choose a valid language'),
  body('durationSec')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Invalid duration'),
];

/** Clip-list query — §32.3 pagination (ADR-034; bounds from §11.3). */
const listQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${PAGINATION_MAX_LIMIT}`),
];

export { audioIdParam, reportIdParam, uploadChain, listQuery };