/**
 * @module middleware/mongoSanitize
 *
 * Express 5 compatibility shim over `express-mongo-sanitize` (§27.2,
 * §26.4 chain position). The package's middleware reassigns
 * `req.query = target`, but Express 5 exposes `req.query` as a
 * getter-only property (`Cannot set property query ... only a getter`),
 * so the stock middleware throws on every request. The package's own
 * `sanitize()` mutates the target object in place, and Express 5's
 * `req.query` getter returns the same cached object on every access —
 * in-place mutation is fully visible downstream. This shim keeps the
 * exact sanitization semantics (strip `$`/`.` operator keys from body,
 * params, headers, and query before validation) without the failing
 * reassignment. No manifest change: the `express-mongo-sanitize`
 * dependency stays at its §13.3 version.
 */
import expressMongoSanitize from 'express-mongo-sanitize';

/**
 * @param {{replaceWith?: string, onSanitize?: function, dryRun?: boolean, allowDots?: boolean}} [options]
 * @returns {import('express').RequestHandler}
 */
export default function mongoSanitize(options = {}) {
  const hasOnSanitize = typeof options.onSanitize === 'function';
  return function mongoSanitizeMiddleware(req, res, next) {
    ['body', 'params', 'headers', 'query'].forEach(function (key) {
      const target = req[key];
      if (!target) return;
      const isSanitized = expressMongoSanitize.has(target, options.allowDots);
      expressMongoSanitize.sanitize(target, options);
      if (isSanitized && hasOnSanitize) {
        options.onSanitize({ req, key });
      }
    });
    next();
  };
}