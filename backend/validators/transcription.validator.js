/**
 * @module validators/transcription
 *
 * The §33/§35 transcription-domain rule chains (§29.5
 * `transcription.validator.js`): the STT write (PUT — bodyless,
 * create-or-replace, ADR-030), the read, and the STT-only
 * correction-dialog endpoint (`POST …/corrections/transcripts`,
 * §31.6/§33.8). The transcripts endpoint's file gates — missing
 * clip ("Record a voice instruction first"), MIME allowlist ("Only
 * audio files are accepted"), size cap — are §31.6/§32 rules
 * enforced by the controller after multer (the file part never
 * reaches a rule chain). The chains hold no business logic: the
 * status gates (`generated`, archived) are the §31.4 guard table in
 * the controller/service.
 */
import { body, param } from 'express-validator';

/** `:reportId` — Mongo ObjectId, else 422 (§29.4). */
const reportIdParam = param('reportId').isMongoId().withMessage('Invalid report id');

/** The transcript endpoint's form field — informational duration (§31.6). */
const transcriptsChain = [
  body('durationSec')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Invalid duration'),
];

export { reportIdParam, transcriptsChain };