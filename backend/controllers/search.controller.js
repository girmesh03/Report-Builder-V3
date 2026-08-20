/**
 * @module controllers/search
 *
 * The §39 global-search surface — `GET /search?q=…` (access, global
 * tier): delegates to `services/search.service.js` (the only `$text`
 * caller — the §39.6 gate) and responds the §27.4 merged shape. The
 * §29 chain validates `q` (trim + quote-strip + 1–100 → 422),
 * `type` (report|branch), `includeArchived`, and pagination — the
 * controller holds no business logic.
 */
import asyncHandler from 'express-async-handler';
import { httpStatus } from '../utils/httpStatus.js';
import { search } from '../services/search.service.js';
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT } from '../utils/constants.js';

/**
 * GET /search — §39.3: zero matches → 200 `docs: []` (never 404,
 * §39.5); results grouped client-side by `type` (§59.3).
 */
export const getSearchResults = asyncHandler(async (req, res) => {
  const query = req.validated.query ?? {};
  const page = query.page !== undefined ? Number(query.page) : PAGINATION_DEFAULT_PAGE;
  const limit = query.limit !== undefined ? Number(query.limit) : PAGINATION_DEFAULT_LIMIT;

  const result = await search({
    userId: req.user._id,
    q: query.q,
    page,
    limit,
    type: query.type,
    includeArchived: query.includeArchived === 'true',
  });

  res.status(httpStatus.OK).json({ success: true, message: 'Search results', data: result });
});