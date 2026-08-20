/**
 * @module controllers/report
 *
 * The §31 report surface — the largest domain: creation (§31.2-1),
 * detail/list (§31.3), the status machine's guard application
 * (the §31.4 table is the only transition authority — this
 * controller applies it), capture/visit updates (§31.5),
 * corrections/content/items (§31.6), and the BR-16 two-path
 * lifecycle (§31.7). Every query is user-scoped (BR-13); every
 * write runs in the §27.7 session template; controllers forward
 * errors with `next(error)`. The active-branch resolution rule
 * (D11): an unknown/foreign branch id → 404; a found-but-archived
 * branch → 422 with the field detail. The content PATCH writes
 * through the §61.3 sanitizer (the server is the last writer of
 * stored content).
 */
import asyncHandler from 'express-async-handler';
import Branch from '../models/branch.model.js';
import Item from '../models/item.model.js';
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import { httpStatus } from '../utils/httpStatus.js';
import { CustomError } from '../utils/errors.js';
import { paginate } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { sanitizeHtml, plainToHtml } from '../utils/sanitizer.js';
import {
  ITEM_STATUSES_BY_TYPE,
  ITEM_TYPES,
  REPORT_STATUSES,
} from '../utils/constants.js';
import { generateReport } from '../services/generation.service.js';
import { applyCorrection } from '../services/correction.service.js';

/** ADR-017: the ReportDto is the model's serialized surface (§31.3). */
const toReportDto = (doc) => doc.toJSON();
const toItemDto = (doc) => doc.toJSON();

/** The §30.6/§31.7 retention copy — the DELETE response message. */
const RETENTION_MESSAGE =
  'Report archived — it will be permanently removed after the retention period';

/** The §31.4 frozen-at-generated copy (capture edits, BR-12). */
const GENERATED_FROZEN = 'This report is already generated';

/**
 * Resolves the visit/branch references of a create/PUT-visits
 * request (D11): unknown/foreign id → 404; archived → 422 with the
 * field detail.
 * @param {string} userId - The owner.
 * @param {string[]} ids - All referenced branch ids.
 * @param {string} fieldFor - Field label resolver (`(id) => 'branch' | 'visits[i].branch'`).
 * @returns {Promise<Map<string, object>>} Resolved live branches by id.
 */
async function resolveBranches(userId, ids, fieldFor) {
  const unique = [...new Set(ids)];
  const branches = await Branch.find({ user: userId, _id: { $in: unique } }).lean();
  const byId = new Map(branches.map((b) => [b._id.toString(), b]));
  for (const id of unique) {
    const branch = byId.get(id);
    if (!branch) {
      throw new CustomError('NOT_FOUND', 'Branch not found');
    }
    if (branch.isArchived) {
      throw new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
        { field: fieldFor(id), message: 'The branch is archived' },
      ]);
    }
  }
  return byId;
}

/**
 * POST /reports — §31.2-1: `{ branch, date?, clockIn, clockOut,
 * visits }`; the visits contract is validated by the chain (≥1,
 * main-locked at [0]); every branch must resolve to an active owned
 * branch (D11). 201 ReportDto at `draft`, `transcription: null`.
 */
export const createReport = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const branchIds = [body.branch, ...(body.visits ?? []).map((v) => v.branch)];
  await resolveBranches(
    req.user._id,
    branchIds,
    (id) => (id === body.branch ? 'branch' : `visits[${(body.visits ?? []).findIndex((v) => v.branch === id)}].branch`),
  );

  const report = await withTransaction(async (session) => {
    const [created] = await Report.create(
      [
        {
          user: req.user._id,
          date: body.date ?? undefined,
          branch: body.branch,
          clockIn: body.clockIn,
          clockOut: body.clockOut,
          visits: body.visits,
        },
      ],
      { session },
    );
    return created;
  });

  res.status(httpStatus.CREATED).json({ success: true, message: 'Report created', data: toReportDto(report) });
});

/**
 * GET /reports — paginated list (§31.3): filters `status`, `branch`,
 * `isArchived` (default hidden), `search` (delegated to §39 — inert
 * here, OQ-009); sort `date` desc with the `createdAt` tiebreak
 * (§21 index).
 */
export const listReports = asyncHandler(async (req, res, next) => {
  const query = req.validated.query ?? {};
  const filter = { user: req.user._id };
  if (query.status !== undefined) filter.status = query.status;
  if (query.branch !== undefined) filter.branch = query.branch;
  filter.isArchived = query.isArchived === 'true';

  const sort =
    query.sort === 'createdAt' ? { createdAt: -1 } : { date: -1, createdAt: -1 };

  const result = await paginate(
    Report,
    filter,
    { page: query.page, limit: query.limit, sort },
    toReportDto,
  );
  res.status(httpStatus.OK).json({ success: true, message: 'Reports', data: result });
});

/**
 * GET /reports/:reportId — 404 for not-found-for-user (BR-13);
 * heavy fields (the transcription `latest` and the Item rows) are
 * excluded unless `?withContent=true` (details page fetches with the
 * flag, §31.3/§51). With content the data carries the C8 shape
 * `{ report, transcription: { latest, items } | null }` (the §34.6/
 * §31.6 single round-trip — the generated content reaches the client
 * as `transcription.latest`).
 */
export const getReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }

  if (req.validated.query?.withContent !== 'true') {
    res.status(httpStatus.OK).json({ success: true, message: 'Report', data: toReportDto(report) });
    return;
  }

  const transcription = await Transcription.findOne({ user: req.user._id, report: report._id });
  if (!transcription) {
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Report',
      data: { report: toReportDto(report), transcription: null },
    });
    return;
  }
  const items = await Item.find({ user: req.user._id, report: report._id })
    .sort({ date: 1, createdAt: 1 })
    .lean();
  const ordered = items.sort(
    (a, b) => ITEM_TYPES.indexOf(a.type) - ITEM_TYPES.indexOf(b.type),
  );
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Report',
    data: {
      report: toReportDto(report),
      transcription: { latest: transcription.latest, items: ordered },
    },
  });
});

/**
 * PATCH /reports/:reportId — header fields (§31.5); capture edits
 * frozen at `generated` (403); a branch swap re-validates the
 * §31.2-1 main lock (visits[0].branch must equal the new branch —
 * the client updates visits first via PUT /visits).
 */
export const updateReport = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  if (report.status === REPORT_STATUSES[3]) {
    next(new CustomError('FORBIDDEN', GENERATED_FROZEN));
    return;
  }

  const updates = {};
  if (body.date !== undefined) updates.date = body.date;
  if (body.clockIn !== undefined) updates.clockIn = body.clockIn;
  if (body.clockOut !== undefined) updates.clockOut = body.clockOut;
  if (body.branch !== undefined && body.branch !== report.branch.toString()) {
    if (report.visits[0]?.branch?.toString() !== body.branch) {
      next(
        new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
          { field: 'visits[0].branch', message: 'The main branch must be the first visit' },
        ]),
      );
      return;
    }
    updates.branch = body.branch;
  }

  const updated = await withTransaction(async (session) => {
    const doc = await Report.findOneAndUpdate(
      { _id: report._id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true, session },
    );
    return doc;
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Report updated', data: toReportDto(updated) });
});

/**
 * PUT /reports/:reportId/visits — replaces the visits block
 * (§31.2-2); every entry resolves to an active owned branch; the
 * main entry at index 0 is locked (the chain enforces the
 * §31.2-1 C1 shape); capture edits frozen at `generated` (403).
 */
export const putVisits = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  if (report.status === REPORT_STATUSES[3]) {
    next(new CustomError('FORBIDDEN', GENERATED_FROZEN));
    return;
  }
  if (body.visits[0].branch !== report.branch.toString()) {
    next(
      new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
        { field: 'visits[0].branch', message: 'The main branch must be the first visit' },
      ]),
    );
    return;
  }

  await resolveBranches(
    req.user._id,
    body.visits.map((v) => v.branch),
    (id) => `visits[${body.visits.findIndex((v) => v.branch === id)}].branch`,
  );

  const updated = await withTransaction(async (session) => {
    const doc = await Report.findOneAndUpdate(
      { _id: report._id, user: req.user._id },
      { $set: { visits: body.visits } },
      { new: true, runValidators: true, session },
    );
    return doc;
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Visits updated', data: toReportDto(updated) });
});

/**
 * PUT /reports/:reportId/visits/:visitIndex — update one positional
 * row (§31.5); index 0 is locked (403) and capture edits are frozen
 * at `generated` (403); out-of-range position → 404.
 */
export const putVisit = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  if (report.status === REPORT_STATUSES[3]) {
    next(new CustomError('FORBIDDEN', GENERATED_FROZEN));
    return;
  }
  const index = Number(req.params.visitIndex);
  if (index === 0) {
    next(new CustomError('FORBIDDEN', 'The main branch entry is locked'));
    return;
  }
  if (index >= report.visits.length) {
    next(new CustomError('NOT_FOUND', 'Visit not found'));
    return;
  }

  const body = req.validated.body ?? {};
  await resolveBranches(req.user._id, [body.branch], () => 'branch');

  const updated = await withTransaction(async (session) => {
    const visits = report.visits.map((v) => v.toObject());
    visits[index] = { branch: body.branch, clockIn: body.clockIn, clockOut: body.clockOut };
    const doc = await Report.findOneAndUpdate(
      { _id: report._id, user: req.user._id },
      { $set: { visits } },
      { new: true, runValidators: true, session },
    );
    return doc;
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Visit updated', data: toReportDto(updated) });
});

/**
 * DELETE /reports/:reportId/visits/:visitIndex — removes one
 * positional row; index 0 is undeletable (403 — the main entry
 * always stands, `visits` never drops below 1); capture edits
 * frozen at `generated` (403); out-of-range → 404.
 */
export const deleteVisit = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  if (report.status === REPORT_STATUSES[3]) {
    next(new CustomError('FORBIDDEN', GENERATED_FROZEN));
    return;
  }
  const index = Number(req.params.visitIndex);
  if (index === 0) {
    next(new CustomError('FORBIDDEN', 'The main branch entry is locked'));
    return;
  }
  if (index >= report.visits.length) {
    next(new CustomError('NOT_FOUND', 'Visit not found'));
    return;
  }

  await withTransaction(async (session) => {
    const visits = report.visits.map((v) => v.toObject());
    visits.splice(index, 1);
    await Report.updateOne(
      { _id: report._id, user: req.user._id },
      { $set: { visits } },
      { session },
    );
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Visit removed', data: null });
});

/**
 * GET /reports/:reportId/items — the report's flat Item rows (C7 —
 * distinct from §38.2's paginated shape): no pagination, ordered
 * activities → issues → comment (§24A.5); a report with no items
 * returns `{ items: [] }` (never 404 for the items themselves).
 */
export const getReportItems = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  const items = await Item.find({ user: req.user._id, report: report._id }).lean();
  const ordered = items.sort(
    (a, b) => ITEM_TYPES.indexOf(a.type) - ITEM_TYPES.indexOf(b.type),
  );
  res.status(httpStatus.OK).json({ success: true, message: 'Report items', data: { items: ordered } });
});

/**
 * PATCH /reports/:reportId/items/:itemId — single-row atomic write
 * (§31.6, never an AI call): per-type status via
 * `ITEM_STATUSES_BY_TYPE` (any direction) and rating only for a
 * comment row (integer 0–5 or null). 404 unknown/foreign item; 422
 * on a set violation.
 */
export const patchItem = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const item = await Item.findOne({ _id: req.params.itemId, user: req.user._id, report: req.params.reportId });
  if (!item) {
    next(new CustomError('NOT_FOUND', 'Item not found'));
    return;
  }

  const allowedStatuses = ITEM_STATUSES_BY_TYPE[item.type] ?? [];
  if (body.status !== undefined && body.status !== null && !allowedStatuses.includes(body.status)) {
    next(
      new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
        { field: 'status', message: 'Status is not allowed for this item type' },
      ]),
    );
    return;
  }
  if (body.rating !== undefined && item.type !== ITEM_TYPES[2]) {
    next(
      new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
        { field: 'rating', message: 'Rating is allowed only on a comment' },
      ]),
    );
    return;
  }

  const updates = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.rating !== undefined) updates.rating = body.rating;

  // §31.6 "single-row atomic writes — fetch row, validate manually":
  // the per-type status set is checked against the row's type above;
  // the write does NOT re-run the schema validators — on a partial
  // update Mongoose's `this.type` is unavailable inside the model's
  // validator, so runValidators would reject a legal per-type value
  // (verified 2026-08-20). The controller is the manual gate.
  const updated = await withTransaction(async (session) => {
    const doc = await Item.findOneAndUpdate(
      { _id: item._id, user: req.user._id },
      { $set: updates },
      { new: true, session },
    );
    return doc;
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Item updated', data: toItemDto(updated) });
});

/**
 * POST /reports/:reportId/generations — §34 generation trigger (ai
 * tier): from `transcribed` only; the single round-trip response
 * (C8) `{ report, transcription: { latest, items } }` — the client
 * never refetches. 502 on provider exhaustion (the service maps).
 */
export const generate = asyncHandler(async (req, res, next) => {
  const result = await generateReport({ reportId: req.params.reportId, userId: req.user._id });
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Report generated',
    data: {
      report: toReportDto(result.report),
      transcription: {
        latest: result.transcription.latest,
        items: result.items.map(toItemDto),
      },
    },
  });
});

/**
 * PATCH /reports/:reportId/content — Mode-1 Save (§31.6): replaces
 * the transcription's `latest` with the client's corrected content,
 * sanitized through the §61.3 server gate, allowed at every status
 * incl. `generated` (BR-10); never touches `raw` (BR-11); no model
 * call (§35.8).
 */
export const saveContent = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  const transcription = await Transcription.findOne({ user: req.user._id, report: report._id });
  if (!transcription) {
    next(new CustomError('UNPROCESSABLE_ENTITY', 'Transcribe the report first'));
    return;
  }

  const content = sanitizeHtml(body.content);
  await withTransaction(async (session) => {
    await Transcription.updateOne(
      { _id: transcription._id, user: req.user._id },
      { $set: { latest: content } },
      { session },
    );
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Content saved', data: { content } });
});

/**
 * PUT /reports/:reportId/content — single undo (§31.6, BR-11):
 * replaces `latest` with `raw` while they differ (idempotent — a
 * second call is a no-op 200); available pre-`generated` only
 * (after generation corrections are the editing path, §23.5);
 * no transcription row → 404 "No transcription yet".
 */
export const revertContent = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  if (report.status === REPORT_STATUSES[3]) {
    next(new CustomError('FORBIDDEN', GENERATED_FROZEN));
    return;
  }
  const transcription = await Transcription.findOne({ user: req.user._id, report: report._id });
  if (!transcription) {
    next(new CustomError('NOT_FOUND', 'No transcription yet'));
    return;
  }

  const target = plainToHtml(transcription.raw);
  let content = transcription.latest;
  if (transcription.latest !== target) {
    await withTransaction(async (session) => {
      await Transcription.updateOne(
        { _id: transcription._id, user: req.user._id },
        { $set: { latest: target } },
        { session },
      );
    });
    content = target;
  }
  res.status(httpStatus.OK).json({ success: true, message: 'Content reverted', data: { content } });
});

/**
 * POST /reports/:reportId/corrections — Mode-2/3 (§35.2): the engine
 * returns the ephemeral corrected snapshot (the candidate — never
 * stored, ADR-033); the client fills the live editor and persists
 * through the content PATCH (§35.5). 422 unknown provider / empty
 * instruction (chain); 502 on provider exhaustion (the service).
 */
export const correct = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const result = await applyCorrection({
    reportId: req.params.reportId,
    userId: req.user._id,
    instruction: body.instruction,
    provider: body.provider,
  });
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Correction ready',
    data: { content: result.content },
  });
});

/**
 * POST /reports/:reportId/archive — BR-16 step 1 (§31.7); archive is
 * allowed at any status incl. `generated`; 409 when already archived.
 */
export const archiveReport = asyncHandler(async (req, res, next) => {
  const report = await withTransaction(async (session) => {
    const current = await Report.findOne({ _id: req.params.reportId, user: req.user._id }).session(session);
    if (!current) throw new CustomError('NOT_FOUND', 'Report not found');
    if (current.isArchived) throw new CustomError('CONFLICT', 'Report is already archived');
    return Report.findByIdAndUpdate(
      current._id,
      { $set: { isArchived: true, archivedAt: new Date() } },
      { new: true, session },
    );
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Report archived', data: toReportDto(report) });
});

/** POST /reports/:reportId/restore — 409 when not archived (§31.7). */
export const restoreReport = asyncHandler(async (req, res, next) => {
  const report = await withTransaction(async (session) => {
    const current = await Report.findOne({ _id: req.params.reportId, user: req.user._id }).session(session);
    if (!current) throw new CustomError('NOT_FOUND', 'Report not found');
    if (!current.isArchived) throw new CustomError('CONFLICT', 'Report is not archived');
    return Report.findByIdAndUpdate(
      current._id,
      { $set: { isArchived: false, archivedAt: null } },
      { new: true, session },
    );
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Report restored', data: toReportDto(report) });
});

/**
 * DELETE /reports/:reportId — BR-16/BR-15 (§31.7): step-1 archive
 * (no immediate hard delete — the §62 sweeper removes the row after
 * `ARCHIVED_TTL_SECONDS` with its cascade); returns 202-style
 * semantics via OK with `{ archived: true }` + the retention copy.
 */
export const deleteReport = asyncHandler(async (req, res, next) => {
  await withTransaction(async (session) => {
    const current = await Report.findOne({ _id: req.params.reportId, user: req.user._id }).session(session);
    if (!current) throw new CustomError('NOT_FOUND', 'Report not found');
    if (!current.isArchived) {
      await Report.updateOne(
        { _id: current._id, user: req.user._id },
        { $set: { isArchived: true, archivedAt: new Date() } },
        { session },
      );
    }
  });
  res.status(httpStatus.OK).json({
    success: true,
    message: RETENTION_MESSAGE,
    data: { archived: true },
  });
});