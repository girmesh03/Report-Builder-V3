/**
 * @module validators/search
 *
 * The §39 search-domain rule chains (§29.5 `search.validator.js`):
 * `q` — required, trimmed, **quotes stripped before the length
 * check** (§39.5: a quotes-only term sanitizes to empty → 422; the
 * `$text` call never sees a `"` — no phrase-syntax surprises),
 * 1–100 chars (§39.3); `type` ∈ {report, branch} (§39.3); the
 * `includeArchived` boolean (§39.4, default false — matching
 * §30.2/§31.3); pagination per §27.6 (`page` ≥ 1, `limit` within
 * `PAGINATION_MAX_LIMIT`). The chains hold no business logic — the
 * scoring and the merged slicing live in the service (§39.4).
 */
import { query } from 'express-validator';
import { PAGINATION_MAX_LIMIT } from '../utils/constants.js';

const searchQuery = [
  query('q')
    .trim()
    .customSanitizer((value) => String(value ?? '').replace(/"/g, ''))
    .notEmpty()
    .withMessage('Provide a search term')
    .isLength({ max: 100 })
    .withMessage('Search term is too long'),
  query('type').optional().isIn(['report', 'branch']).withMessage('Invalid result type'),
  query('includeArchived').optional().isIn(['true', 'false']).withMessage('Invalid archive filter'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${PAGINATION_MAX_LIMIT}`),
];

export { searchQuery };