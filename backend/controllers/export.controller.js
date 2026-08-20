/**
 * @module controllers/export
 *
 * The §37 backend export surface: the authenticated content
 * retrieval for the §58 client formats
 * (`GET /reports/:reportId/export/content` — access, global tier).
 * The Google Docs export route is **not mounted** while
 * `EXPORT_DOCS_ENABLED` is `false` (the §11.3 constant) — any call
 * falls through to the §27.5 not-found handler (404 "Route not
 * found"), matching the §58 "coming soon" menu state. Export
 * reproduces the report's current content at the moment of the
 * request (BR-18); nothing is persisted (no `exportedAt` anywhere,
 * §21.2/§37.7).
 */
import asyncHandler from 'express-async-handler';
import Branch from '../models/branch.model.js';
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import { httpStatus } from '../utils/httpStatus.js';
import { CustomError } from '../utils/errors.js';

/**
 * GET /reports/:reportId/export/content — §37.5: `{ content: latest,
 * date, branchName, visits }` — the exact current content the §58
 * PDF/TXT/CSV/XLSX flows format. `±` tokens are returned **as-is**
 * (the §58 formats print them verbatim; resolution happens only in
 * the backend Google Docs path §37.3). Content is returned as
 * stored — the `latest` HTML (it passed the §61 write gate; D33).
 * 422 "Nothing to export yet" pre-`latest` (§37.2); archived reports
 * may still export (read-only view, §51); `generated` status is not
 * required (editable reports export their current `latest`,
 * BR-10/BR-18).
 */
export const getExportContent = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }

  const transcription = await Transcription.findOne({ user: req.user._id, report: report._id });
  if (!transcription || transcription.latest === null) {
    next(new CustomError('UNPROCESSABLE_ENTITY', 'Nothing to export yet'));
    return;
  }

  const branchIds = [report.branch, ...report.visits.map((v) => v.branch)];
  const branches = await Branch.find({ user: req.user._id, _id: { $in: branchIds } }).lean();
  const nameOf = (id) => branches.find((b) => b._id.toString() === id.toString())?.name ?? null;

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Export ready',
    data: {
      content: transcription.latest,
      date: report.date ?? null,
      branchName: nameOf(report.branch),
      visits: report.visits.map((visit) => ({
        branchName: nameOf(visit.branch),
        clockIn: visit.clockIn,
        clockOut: visit.clockOut,
      })),
    },
  });
});