/**
 * @module routes/audio
 *
 * The §32 audio route module, mounted by the §26.5 registry at
 * `/api/v1` — this router declares its own full path segments (it
 * spans two mount families: `/reports/:reportId/clips` and
 * `/audios/:audioId`), so it mounts at the registry root with no
 * path prefix. **`authenticate` is per-route, never router-wide**:
 * a root-mounted router intercepts every `/api/v1/*` request on
 * entry (including unmatched paths, which must fall through to the
 * §27.5 404 handler) — `router.use(authenticate)` would 401 them
 * all. All routes sit on the global tier (§27.3). The upload multer
 * runs before the controller (the file gates are §32.2 controller
 * rules).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  uploadClip,
  listClips,
  getClip,
  playClip,
  deleteClip,
  clipUpload,
} from '../controllers/audio.controller.js';
import { uploadChain, listQuery, audioIdParam, reportIdParam } from '../validators/audio.validator.js';
import { validate } from '../validators/validation.js';

const audioRoutes = Router();

audioRoutes.post('/reports/:reportId/clips', authenticate, reportIdParam, clipUpload.single('clip'), uploadChain, validate, uploadClip);
audioRoutes.get('/reports/:reportId/clips', authenticate, reportIdParam, listQuery, validate, listClips);
audioRoutes.get('/audios/:audioId', authenticate, audioIdParam, validate, getClip);
audioRoutes.get('/audios/:audioId/play', authenticate, audioIdParam, validate, playClip);
audioRoutes.delete('/audios/:audioId', authenticate, audioIdParam, validate, deleteClip);

export default audioRoutes;