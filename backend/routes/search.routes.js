/**
 * @module routes/search
 *
 * The §39 route module, mounted by the §26.5 registry at
 * `/api/v1/search` — a **path-scoped** mount (router-wide
 * `authenticate` is safe — the prefix matches only this router's
 * own path; the §27.5 404 envelope is preserved). Global tier
 * (§27.3); access cookie required (§28.4).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getSearchResults } from '../controllers/search.controller.js';
import { searchQuery } from '../validators/search.validator.js';
import { validate } from '../validators/validation.js';

const searchRoutes = Router();

searchRoutes.use(authenticate);

searchRoutes.get('/', searchQuery, validate, getSearchResults);

export default searchRoutes;