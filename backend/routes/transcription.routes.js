/**
 * @module routes/transcription
 *
 * The §33/§31.6 transcription route module, mounted by the §26.5
 * registry at `/api/v1` with its own full path segments: the STT
 * write and read (`/reports/:reportId/transcription`) and the
 * STT-only correction-dialog endpoint (`/reports/:reportId/
 * corrections/transcripts` — §33.8 owns the endpoint row and names
 * this file; §31.6 supplies the guards). The write and the
 * transcripts endpoint sit on the ai tier (§33.8 — route-level
 * `aiLimiter`; the global limiter skips those paths); the read is
 * global (§33.8). The transcripts multer runs before the controller.
 * **`authenticate` is per-route, never router-wide** — this router
 * mounts at the registry root with full path segments; a router-wide
 * `authenticate` would 401 every unmatched `/api/v1/*` request
 * instead of letting it reach the §27.5 404 handler.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import {
  putTranscription,
  getTranscription,
  transcribeInstruction,
  clipUpload,
} from '../controllers/transcription.controller.js';
import { reportIdParam, transcriptsChain } from '../validators/transcription.validator.js';
import { validate } from '../validators/validation.js';

const transcriptionRoutes = Router();

transcriptionRoutes.put('/reports/:reportId/transcription', authenticate, reportIdParam, aiLimiter, validate, putTranscription);
transcriptionRoutes.get('/reports/:reportId/transcription', authenticate, reportIdParam, validate, getTranscription);
transcriptionRoutes.post(
  '/reports/:reportId/corrections/transcripts',
  authenticate,
  reportIdParam,
  aiLimiter,
  clipUpload.single('clip'),
  transcriptsChain,
  validate,
  transcribeInstruction,
);

export default transcriptionRoutes;