/**
 * @module routes/export
 *
 * The §37 route module, mounted by the §26.5 registry at `/api/v1`
 * **at the root with full path segments** (`/reports/:reportId/
 * export/content` — it spans the reports family without colliding
 * with §31's routes: `/reports/:reportId` never matches the longer
 * export path). **`authenticate` is per-route, never router-wide** —
 * a root-mounted router intercepts every `/api/v1/*` request on
 * entry (the sub-phase-4 404-envelope lesson, F92). The Google Docs
 * export endpoint is **not mounted** while `EXPORT_DOCS_ENABLED` is
 * `false` (the §11.3 constant, §37.3) — any call falls through to
 * the §27.5 not-found handler (404 "Route not found") and the §58
 * menu shows the "coming soon" copy. Global tier (§27.3).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getExportContent } from '../controllers/export.controller.js';
import { reportIdParam } from '../validators/export.validator.js';
import { validate } from '../validators/validation.js';
import { EXPORT_DOCS_ENABLED } from '../utils/constants.js';

const exportRoutes = Router();

exportRoutes.get('/reports/:reportId/export/content', authenticate, reportIdParam, validate, getExportContent);

// The §37.3 Google Docs export route mounts here only when the
// flag flips true (§11.3) — the dormant `services/drive.service.js`
// is its boundary; the flag-on handler is wired when ADR-024
// closes (§37.4). While false, any call falls through to the §27.5
// not-found handler (404 "Route not found").
if (EXPORT_DOCS_ENABLED) {
  exportRoutes.post('/reports/:reportId/export/docs', authenticate, reportIdParam, validate, () => {
    throw new Error('drive route wiring is deferred until ADR-024 closes');
  });
}

export default exportRoutes;