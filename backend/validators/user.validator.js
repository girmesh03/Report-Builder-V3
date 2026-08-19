/**
 * @module validators/user
 *
 * The §28 user-domain rule chains (§29.5 `user.validator.js`):
 * register, login, and profile. Field-level rules mirror the
 * §28.3/§57.3 contracts; messages are the plain-language copies of
 * §28.3's contract JSON where given, otherwise derived per §69.
 * The chains hold no business logic (guards live in services,
 * never in validators — §29.1). Email normalization follows §19.2
 * (`normalizeEmail` with `gmail_remove_dots: false` — the lower-
 * case fold and dot-preservation are the validators' job, never
 * composed in the schema).
 */
import { body } from 'express-validator';
import validator from 'validator';

const { normalizeEmail } = validator;

/** §19.2 normalization — never strips Gmail dots. */
const EMAIL_NORMALIZE_OPTS = { gmail_remove_dots: false };

/** Registration — email + password only; names derive from the email local part (§19). */
const registerChain = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(EMAIL_NORMALIZE_OPTS),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').not().exists().withMessage('First name is not accepted at registration'),
  body('lastName').not().exists().withMessage('Last name is not accepted at registration'),
];

/** Login — both fields required; identical 401 handled by the controller (§28.3). */
const loginChain = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email')
    .normalizeEmail(EMAIL_NORMALIZE_OPTS),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Profile — position/firstName/lastName are optional but at least
 * one field (or an `avatar` file, §28.5) must be present. Lengths
 * mirror §57.3 (§29.4 mirrors §29): position 1..200, names 1..100.
 */
const profileChain = [
  body('position')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('Position cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Position is too long'),
  body('firstName')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name is too long'),
  body('lastName')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name is too long'),
  body().custom((_, { req }) => {
    const body = req.body ?? {};
    const hasField =
      body.position !== undefined ||
      body.firstName !== undefined ||
      body.lastName !== undefined;
    if (!hasField && !req.file) {
      throw new Error('Provide at least one field to update');
    }
    return true;
  }),
];

export { registerChain, loginChain, profileChain };