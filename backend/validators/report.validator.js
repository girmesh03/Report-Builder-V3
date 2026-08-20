/**
 * @module validators/report
 *
 * The §31 report-domain rule chains (§29.5 `report.validator.js`):
 * creation (§31.2-1), capture updates (§31.5), content writes
 * (§31.6), item writes (§31.6), list filters (§31.3), and the
 * shared param chains. Field-level rules mirror the §31 contract
 * JSON; the chains hold **no transition logic** — the §31.4 guard
 * table lives in the controller/service (never in validators,
 * §29.1). The one cross-field rule that lives here is the §31.2-1
 * main-branch lock (`visits[0].branch === branch` — a validation-
 * shaped 422 with `details[0] = { field: "visits[0].branch", … }`).
 */
import { body, param, query } from 'express-validator';
import {
  AI_PROVIDERS,
  PAGINATION_MAX_LIMIT,
  REPORT_STATUSES,
} from '../utils/constants.js';

/** The §29.4 `HH:mm` day-clock rule. */
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** `:reportId` — Mongo ObjectId, else 422 (§29.4). */
const reportIdParam = param('reportId').isMongoId().withMessage('Invalid report id');

/** `:itemId` — Mongo ObjectId, else 422 (§29.4). */
const itemIdParam = param('itemId').isMongoId().withMessage('Invalid item id');

/** `:visitIndex` — non-negative integer (§31.5 positional rows). */
const visitIndexParam = param('visitIndex')
  .isInt({ min: 0 })
  .withMessage('Invalid visit position');

/**
 * The §31.2-1 visits block: required, never empty, every entry a
 * full day-clock pair, and the main-branch lock — `visits[0].branch`
 * must equal the report's `branch` (422 with the C1 field detail).
 */
const visitsBlock = [
  body('visits')
    .isArray({ min: 1 })
    .withMessage('Visits are required — the main branch always comes first'),
  body('visits.*.branch').isMongoId().withMessage('Choose a valid branch'),
  body('visits.*.clockIn').matches(TIME_REGEX).withMessage('Enter the visit start time'),
  body('visits.*.clockOut').matches(TIME_REGEX).withMessage('Enter the visit end time'),
  body('visits[0].branch')
    .optional()
    .custom((value, { req }) => {
      // §31.2-1 create carries the top-level `branch` — the lock is
      // checked here; §31.2-2 PUT /visits has no top-level branch —
      // the controller checks against the report's STORED branch
      // (the validator never reads the DB, §29.1).
      if (req.body?.branch === undefined) return true;
      if (value !== req.body.branch) {
        throw new Error('The main branch must be the first visit');
      }
      return true;
    }),
];

/** Create — §31.2-1: `{ branch, date?, clockIn, clockOut, visits }`. */
const createChain = [
  body('branch').isMongoId().withMessage('Choose a valid branch'),
  body('date').optional({ values: 'null' }).isISO8601().withMessage('Enter a valid date'),
  body('clockIn').matches(TIME_REGEX).withMessage('Enter the work start time'),
  body('clockOut').matches(TIME_REGEX).withMessage('Enter the work end time'),
  ...visitsBlock,
];

/** PATCH — header fields; at least one present (§31.5). */
const updateChain = [
  body('date').optional({ values: 'null' }).isISO8601().withMessage('Enter a valid date'),
  body('clockIn').optional().matches(TIME_REGEX).withMessage('Enter the work start time'),
  body('clockOut').optional().matches(TIME_REGEX).withMessage('Enter the work end time'),
  body('branch').optional().isMongoId().withMessage('Choose a valid branch'),
  body().custom((_, { req }) => {
    const body = req.body ?? {};
    const present = ['date', 'clockIn', 'clockOut', 'branch'].some((k) => body[k] !== undefined);
    if (!present) {
      throw new Error('Provide at least one field to update');
    }
    return true;
  }),
];

/** PUT /visits — the visits block only (§31.2-2). */
const putVisitsChain = [...visitsBlock];

/** PUT /visits/:visitIndex — one positional row (§31.5). */
const putVisitChain = [
  body('branch').isMongoId().withMessage('Choose a valid branch'),
  body('clockIn').matches(TIME_REGEX).withMessage('Enter the visit start time'),
  body('clockOut').matches(TIME_REGEX).withMessage('Enter the visit end time'),
];

/**
 * Content PATCH — §31.6: replaces the transcription's `latest`;
 * empty or over the documented safety bound → 422 (the bound's
 * provenance is the §69 D10 open-question row — no §11 constant
 * exists yet; the row records the implemented bound).
 */
const CONTENT_MAX_LENGTH = 1000000;
const contentPatchChain = [
  body('content')
    .isString()
    .withMessage('Content is required')
    .trim()
    .notEmpty()
    .withMessage('The content cannot be empty')
    .isLength({ max: CONTENT_MAX_LENGTH })
    .withMessage('Content is too long'),
];

/**
 * Item PATCH — §31.6: `{ status?, rating? }`; per-type status via
 * `ITEM_STATUSES_BY_TYPE` (any direction — the transition guard
 * table is §31's, not the validator's) and integer 0–5 or null
 * rating on a comment row only. Type-membership is enforced
 * manually in the controller (the row's own type decides the set —
 * §31.6 "fetch row, validate manually").
 */
const itemPatchChain = [
  body('status').optional({ values: 'null' }).isString().withMessage('Invalid status'),
  body('rating')
    .optional({ values: 'null' })
    .isInt({ min: 0, max: 5 })
    .withMessage('Rating must be an integer between 0 and 5'),
  body().custom((_, { req }) => {
    const body = req.body ?? {};
    if (body.status === undefined && body.rating === undefined) {
      throw new Error('Provide a status or a rating');
    }
    return true;
  }),
];

/** List query — §31.3 filters + pagination; `search` is §39-deferred (inert, OQ-009). */
const listQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${PAGINATION_MAX_LIMIT}`),
  query('status').optional().isIn(REPORT_STATUSES).withMessage('Invalid status filter'),
  query('branch').optional().isMongoId().withMessage('Invalid branch filter'),
  query('isArchived').optional().isIn(['true', 'false']).withMessage('Invalid archive filter'),
  query('search').optional().isString().withMessage('Invalid search query'),
  query('sort').optional().isIn(['date', 'createdAt']).withMessage('Invalid sort field'),
];

/** Detail query — `withContent` boolean (§31.3). */
const detailQuery = [
  query('withContent').optional().isIn(['true', 'false']).withMessage('Invalid detail flag'),
];

/** Corrections POST — §35.2: typed instruction (+ optional provider from `AI_PROVIDERS`). */
const correctionsChain = [
  body('instruction')
    .isString()
    .withMessage('Instruction is required')
    .trim()
    .notEmpty()
    .withMessage('Write a correction instruction first')
    .isLength({ max: 10000 })
    .withMessage('Instruction is too long'),
  body('provider').optional().isIn(AI_PROVIDERS).withMessage('Choose a valid provider'),
];

export {
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
};