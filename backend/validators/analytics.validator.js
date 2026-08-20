/**
 * @module validators/analytics
 *
 * The §38 analytics-domain rule chains (§29.5
 * `analytics.validator.js`): the §38.2 item-filter contract — the
 * filters are first defined in §38.2 and validated here — `branch`
 * (ObjectId), `type` (an `ITEM_TYPES` member), `status` (an
 * `ITEM_STATUSES` member — the §38.2 example's legacy `open` value
 * is not a member; the D13 per-type vocabulary governs, amended
 * 2026-08-20), `dateFrom`/`dateTo` (ISO 8601), `q` (a plain string —
 * the literal-escaped `$regex` is the controller's D27 mechanism),
 * and pagination per §27.6. The dashboard endpoint takes no
 * parameters (the §49.3 contract — no filters exist on it).
 */
import { query } from 'express-validator';
import {
  ITEM_STATUSES,
  ITEM_TYPES,
  PAGINATION_MAX_LIMIT,
} from '../utils/constants.js';

const itemsQuery = [
  query('branch').optional().isMongoId().withMessage('Invalid branch filter'),
  query('type').optional().isIn(ITEM_TYPES).withMessage('Invalid item type filter'),
  query('status').optional().isIn(ITEM_STATUSES).withMessage('Invalid item status filter'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid from date'),
  query('dateTo').optional().isISO8601().withMessage('Invalid to date'),
  query('q').optional().isString().withMessage('Invalid search term'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${PAGINATION_MAX_LIMIT}`),
];

export { itemsQuery };