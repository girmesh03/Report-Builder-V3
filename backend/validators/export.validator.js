/**
 * @module validators/export
 *
 * The §37 export-domain rule chains (§29.5 `export.validator.js`):
 * the `:reportId` param (Mongo ObjectId → 422, §29.4). The Google
 * Docs export route is unmounted while `EXPORT_DOCS_ENABLED` is
 * false — it needs no chain.
 */
import { param } from 'express-validator';

const reportIdParam = param('reportId').isMongoId().withMessage('Invalid report id');

export { reportIdParam };