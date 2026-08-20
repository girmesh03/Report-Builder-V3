/**
 * @module controllers/branch
 *
 * The §30 branch surface: list/filter (§30.2), the §30.2.1 detail
 * aggregate, create/update (§30.3/§30.4), the BR-14 two-path
 * lifecycle (archive/restore §30.5, permanent-delete-as-step-1
 * §30.6), all user-scoped (BR-13 — every query carries
 * `user: req.user._id`; another user's branch is indistinguishable
 * from nonexistent, 404). Writes run in the §27.7 session
 * template; controllers forward errors with `next(error)` and never
 * respond directly outside the §27.4 envelope. No hard delete
 * exists here — the sweeper owns physical removal after
 * `ARCHIVED_TTL_SECONDS` (§62).
 */
import asyncHandler from 'express-async-handler';
import Branch from '../models/branch.model.js';
import Item from '../models/item.model.js';
import Report from '../models/report.model.js';
import { httpStatus } from '../utils/httpStatus.js';
import { CustomError } from '../utils/errors.js';
import { paginate } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import {
  currentEthiopianMonth,
  ethiopianMonthRange,
} from '../utils/ethiopianDate.js';
import {
  ITEM_STATUSES,
  ITEM_TYPES,
  PAGINATION_DEFAULT_LIMIT,
  REPORT_STATUSES,
} from '../utils/constants.js';

/** ADR-017: the BranchDto is the model's serialized surface (§30.2). */
const toBranchDto = (doc) => doc.toJSON();

/** The retention copy of §30.6 — the DELETE response message. */
const RETENTION_MESSAGE =
  'Branch archived — it will be permanently removed after the retention period';

/**
 * GET /branches — paginated; `isArchived` absent or `false` →
 * active only (BR-14 default); `name` asc default (§30.2).
 */
export const listBranches = asyncHandler(async (req, res) => {
  const query = req.validated.query ?? {};
  const isArchived = query.isArchived === 'true';
  const result = await paginate(
    Branch,
    { user: req.user._id, isArchived },
    { page: query.page, limit: query.limit, sort: { name: 1 } },
    toBranchDto,
  );
  res.status(httpStatus.OK).json({ success: true, message: 'Branches', data: result });
});

/**
 * GET /branches/:branchId — BranchDto; 404 for not-found-for-this-user
 * (BR-13).
 */
export const getBranch = asyncHandler(async (req, res, next) => {
  const branch = await Branch.findOne({ _id: req.params.branchId, user: req.user._id });
  if (!branch) {
    next(new CustomError('NOT_FOUND', 'Branch not found'));
    return;
  }
  res.status(httpStatus.OK).json({ success: true, message: 'Branch', data: toBranchDto(branch) });
});

/**
 * GET /branches/:branchId/detail — the §30.2.1 aggregate (owner
 * directive 2026-08-19): one call serving the whole §56.5 page.
 * Reports paginated newest-first (active by default); the analytics
 * block computed server-side; the branch's Item rows grouped by
 * type.
 */
export const getBranchDetail = asyncHandler(async (req, res, next) => {
  const branch = await Branch.findOne({ _id: req.params.branchId, user: req.user._id });
  if (!branch) {
    next(new CustomError('NOT_FOUND', 'Branch not found'));
    return;
  }

  const query = req.validated.query ?? {};
  const reportsResult = await paginate(
    Report,
    { user: req.user._id, branch: branch._id, isArchived: false },
    { page: query.page, limit: query.limit, sort: { date: -1, createdAt: -1 } },
    (doc) => doc.toJSON(),
  );

  const month = currentEthiopianMonth();
  const { start, end } = ethiopianMonthRange(month.year, month.month);
  const [reportsTotal, reportsThisMonth, statuses, openIssues, activitiesCompleted, commentCount, issuesTrend] =
    await Promise.all([
      Report.countDocuments({ user: req.user._id, branch: branch._id }),
      Report.countDocuments({ user: req.user._id, branch: branch._id, date: { $gte: start, $lt: end } }),
      Report.aggregate([
        { $match: { user: req.user._id, branch: branch._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Item.countDocuments({ user: req.user._id, branch: branch._id, type: 'issue', status: { $in: [ITEM_STATUSES[0], ITEM_STATUSES[1]] } }),
      Item.countDocuments({ user: req.user._id, branch: branch._id, type: 'activity', status: ITEM_STATUSES[2] }),
      Item.countDocuments({ user: req.user._id, branch: branch._id, type: 'comment' }),
      Item.aggregate([
        {
          $match: {
            user: req.user._id,
            branch: branch._id,
            type: 'issue',
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  const statusCount = new Map(statuses.map((s) => [s._id, s.count]));
  const statusDistribution = REPORT_STATUSES.map((status) => ({ status, count: statusCount.get(status) ?? 0 }));

  const itemRows = await Item.find({ user: req.user._id, branch: branch._id }).sort({ date: 1 }).lean();
  const items = { activities: [], issues: [], comments: [] };
  for (const row of itemRows) {
    if (row.type === ITEM_TYPES[0]) items.activities.push(row);
    else if (row.type === ITEM_TYPES[1]) items.issues.push(row);
    else if (row.type === ITEM_TYPES[2]) items.comments.push(row);
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Branch details',
    data: {
      branch: toBranchDto(branch),
      reports: reportsResult,
      analytics: {
        reportsTotal,
        reportsThisMonth,
        statusDistribution,
        openIssues,
        activitiesCompleted,
        commentCount,
        issuesTrend: issuesTrend.map((r) => ({ date: r._id, count: r.count })),
      },
      items,
    },
  });
});

/**
 * POST /branches — create; duplicate names allowed (no unique index,
 * §20). 201 with the BranchDto (§30.3).
 */
export const createBranch = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const branch = await withTransaction(async (session) => {
    const [created] = await Branch.create(
      [{ user: req.user._id, name: body.name, location: body.location }],
      { session },
    );
    return created;
  });
  res.status(httpStatus.CREATED).json({ success: true, message: 'Branch created', data: toBranchDto(branch) });
});

/**
 * PATCH /branches/:branchId — at least one of name/location; never
 * cascades into reports (BR-14: the live join resolves the current
 * name at read time, §20/§21.7). Archived branches stay updatable
 * (§30.4).
 */
export const updateBranch = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.location !== undefined) updates.location = body.location;

  const branch = await withTransaction(async (session) => {
    const updated = await Branch.findOneAndUpdate(
      { _id: req.params.branchId, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true, session },
    );
    if (!updated) throw new CustomError('NOT_FOUND', 'Branch not found');
    return updated;
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Branch updated', data: toBranchDto(branch) });
});

/**
 * POST /branches/:branchId/archive — the BR-14 two-path step 1; a
 * re-archive is a 409 lifecycle violation (§30.5).
 */
export const archiveBranch = asyncHandler(async (req, res, next) => {
  const branch = await withTransaction(async (session) => {
    const current = await Branch.findOne({ _id: req.params.branchId, user: req.user._id }).session(session);
    if (!current) throw new CustomError('NOT_FOUND', 'Branch not found');
    if (current.isArchived) throw new CustomError('CONFLICT', 'Branch is already archived');
    const updated = await Branch.findByIdAndUpdate(
      current._id,
      { $set: { isArchived: true, archivedAt: new Date() } },
      { new: true, session },
    );
    return updated;
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Branch archived', data: toBranchDto(branch) });
});

/** POST /branches/:branchId/restore — 409 when not archived (§30.5). */
export const restoreBranch = asyncHandler(async (req, res, next) => {
  const branch = await withTransaction(async (session) => {
    const current = await Branch.findOne({ _id: req.params.branchId, user: req.user._id }).session(session);
    if (!current) throw new CustomError('NOT_FOUND', 'Branch not found');
    if (!current.isArchived) throw new CustomError('CONFLICT', 'Branch is not archived');
    const updated = await Branch.findByIdAndUpdate(
      current._id,
      { $set: { isArchived: false, archivedAt: null } },
      { new: true, session },
    );
    return updated;
  });
  res.status(httpStatus.OK).json({ success: true, message: 'Branch restored', data: toBranchDto(branch) });
});

/**
 * DELETE /branches/:branchId — **no immediate hard delete** (§30.6,
 * BR-15/§62): archives as the deletion's step-1 and returns 202-style
 * semantics via OK with `{ archived: true }` + the retention copy;
 * the physical removal happens in the sweeper after
 * `ARCHIVED_TTL_SECONDS`. There is no `deletedAt` anywhere (§18.3).
 */
export const deleteBranch = asyncHandler(async (req, res, next) => {
  await withTransaction(async (session) => {
    const current = await Branch.findOne({ _id: req.params.branchId, user: req.user._id }).session(session);
    if (!current) throw new CustomError('NOT_FOUND', 'Branch not found');
    if (!current.isArchived) {
      await Branch.findByIdAndUpdate(
        current._id,
        { $set: { isArchived: true, archivedAt: current.archivedAt ?? new Date() } },
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