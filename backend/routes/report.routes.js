/**
 * @module routes/report
 *
 * The §31 route module, mounted by the §26.5 registry at `/api/v1`.
 * Every endpoint requires the access cookie (§28.4); the generation
 * and correction endpoints sit on the ai tier (§27.3 — the
 * `aiLimiter` applied route-level; the global limiter skips those
 * paths), the rest on the global tier. Chains mount before the
 * controller with `validate()` between them (§29.3); route order
 * follows the §31.9 matrix.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import {
  createReport,
  listReports,
  getReport,
  updateReport,
  putVisits,
  putVisit,
  deleteVisit,
  getReportItems,
  patchItem,
  generate,
  saveContent,
  revertContent,
  correct,
  archiveReport,
  restoreReport,
  deleteReport,
} from '../controllers/report.controller.js';
import {
  createChain,
  updateChain,
  putVisitsChain,
  putVisitChain,
  visitIndexParam,
  contentPatchChain,
  itemPatchChain,
  itemIdParam,
  listQuery,
  detailQuery,
  reportIdParam,
  correctionsChain,
} from '../validators/report.validator.js';
import { validate } from '../validators/validation.js';

const reportRoutes = Router();

reportRoutes.use(authenticate);

reportRoutes.post('/', createChain, validate, createReport);
reportRoutes.get('/', listQuery, validate, listReports);
reportRoutes.get('/:reportId', reportIdParam, detailQuery, validate, getReport);
reportRoutes.patch('/:reportId', reportIdParam, updateChain, validate, updateReport);
reportRoutes.put('/:reportId/visits', reportIdParam, putVisitsChain, validate, putVisits);
reportRoutes.put('/:reportId/visits/:visitIndex', reportIdParam, visitIndexParam, putVisitChain, validate, putVisit);
reportRoutes.delete('/:reportId/visits/:visitIndex', reportIdParam, visitIndexParam, validate, deleteVisit);
reportRoutes.get('/:reportId/items', reportIdParam, validate, getReportItems);
reportRoutes.patch('/:reportId/items/:itemId', reportIdParam, itemIdParam, itemPatchChain, validate, patchItem);
reportRoutes.post('/:reportId/generations', reportIdParam, aiLimiter, validate, generate);
reportRoutes.patch('/:reportId/content', reportIdParam, contentPatchChain, validate, saveContent);
reportRoutes.put('/:reportId/content', reportIdParam, validate, revertContent);
reportRoutes.post('/:reportId/corrections', reportIdParam, aiLimiter, correctionsChain, validate, correct);
reportRoutes.post('/:reportId/archive', reportIdParam, validate, archiveReport);
reportRoutes.post('/:reportId/restore', reportIdParam, validate, restoreReport);
reportRoutes.delete('/:reportId', reportIdParam, validate, deleteReport);

export default reportRoutes;