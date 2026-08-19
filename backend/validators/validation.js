/**
 * @module validators/validation
 *
 * The validation harness (ADR-016, §29.2): a single `validate()`
 * middleware every route module mounts after its rule chain. On
 * failure it responds 422 with the §27-owned envelope plus
 * `details: [{ field, message }]` — one entry per failed field,
 * first failure wins per field, chain errors never abort before
 * this middleware. On success it attaches
 * `req.validated = { body, params, query }` via `matchedData(...)`
 * (only declared fields) and continues.
 */
import { validationResult, matchedData } from 'express-validator';
import { CustomError } from '../utils/errors.js';

/**
 * Runs `validationResult`, maps failures to the 422 details shape,
 * or attaches `req.validated` (§29.2).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function validate(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const details = [];
    for (const err of result.array()) {
      if (!details.some((d) => d.field === err.path)) {
        details.push({ field: err.path, message: err.msg });
      }
    }
    next(new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', details));
    return;
  }

  req.validated = {
    body: matchedData(req, { locations: ['body'], includeOptionals: false }),
    params: matchedData(req, { locations: ['params'], includeOptionals: false }),
    query: matchedData(req, { locations: ['query'], includeOptionals: false }),
  };
  next();
}