/**
 * @module validators/branch
 *
 * The §30 branch-domain rule chains (§29.5 `branch.validator.js`):
 * create, update, and the shared param/query chains. Rules mirror
 * the §30.3/§30.4/§30.2 contracts; messages are plain end-user
 * language. The chains hold no business logic — the archive/restore
 * lifecycle guards and the BR-13 scoping live in the controller
 * (§29.1, §30.5/§30.7). Duplicate names are allowed (no unique
 * index, §20 — no 409 exists on create).
 */
import { body, param, query } from 'express-validator';
import { PAGINATION_MAX_LIMIT } from '../utils/constants.js';

/** Name bounds — §30.3: 1..100, trimmed. */
const nameChain = body('name')
  .trim()
  .notEmpty()
  .withMessage('Name is required')
  .isLength({ max: 100 })
  .withMessage('Name is too long');

/** Location bounds — §30.3: 1..200, trimmed. */
const locationChain = body('location')
  .trim()
  .notEmpty()
  .withMessage('Location is required')
  .isLength({ max: 200 })
  .withMessage('Location is too long');

/** Create — both fields required (§30.3). */
const createChain = [nameChain, locationChain];

/** Update — at least one of name/location present (§30.4). */
const updateChain = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name is too long'),
  body('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Location is too long'),
  body().custom((_, { req }) => {
    const hasName = req.body?.name !== undefined;
    const hasLocation = req.body?.location !== undefined;
    if (!hasName && !hasLocation) {
      throw new Error('Provide at least one field to update');
    }
    return true;
  }),
];

/** `:branchId` — Mongo ObjectId, else 422 (§29.4; never 404). */
const branchIdParam = param('branchId').isMongoId().withMessage('Invalid branch id');

/**
 * List query (§30.2): pagination bounds from `PAGINATION_*`, the
 * `sort` whitelist (`name` asc default), `isArchived` boolean
 * ('true'/'false' — absent or 'false' → active only, BR-14).
 */
const listQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${PAGINATION_MAX_LIMIT}`),
  query('sort').optional().isIn(['name']).withMessage('Invalid sort field'),
  query('isArchived').optional().isIn(['true', 'false']).withMessage('Invalid archive filter'),
];

export { createChain, updateChain, branchIdParam, listQuery };