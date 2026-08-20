/**
 * @module controllers/analytics
 *
 * The §38 aggregation home (the §38.7 gate: the analytics controller
 * and the §30.2.1 branch-detail aggregate are the ONLY aggregation-
 * pipeline homes in the backend — no `$group` elsewhere for UI
 * data): `GET /analytics/dashboard` (the §49 ledger band + charts,
 * ADR-034 — the client never aggregates) and `GET /analytics/items`
 * (the §38.2 item-filter contract over **stored Item rows only** —
 * no derivation, no model call in the loop). Every count is
 * personally scoped (BR-13) and excludes archived reports; KPI
 * totals are per-dimension (BR-01/BR-19: a null `date` never breaks
 * a bucket — it simply doesn't count into the month buckets, §38.5).
 */
import asyncHandler from 'express-async-handler';
import Branch from '../models/branch.model.js';
import Item from '../models/item.model.js';
import Report from '../models/report.model.js';
import { httpStatus } from '../utils/httpStatus.js';
import { paginate } from '../utils/pagination.js';
import {
  currentEthiopianMonth,
  ethiopianMonthRange,
} from '../utils/ethiopianDate.js';
import {
  ITEM_TYPES,
  REPORT_STATUSES,
} from '../utils/constants.js';

/** The §38 open-state set (draft + audio_attached + transcribed) — follows §31. */
const OPEN_STATES = REPORT_STATUSES.slice(0, 3);

/** The §38.4 issuesTrend window (the recent 30 days — §38.2). */
const TREND_DAYS = 30;

/** ADR-017: the ItemDto is the model's serialized surface (§24A.5). */
const toItemDto = (doc) => doc.toJSON();

/** The previous Ethiopian month of a `{year, month}` bucket (13 → 12, 1 → prev year 13). */
function previousEthiopianMonth(year, month) {
  return month === 1 ? { year: year - 1, month: 13 } : { year, month: month - 1 };
}

/**
 * GET /analytics/dashboard — the §38.2 payload: kpis (4 cells +
 * optional trends vs the previous Ethiopian month) + charts
 * (4-slice zero-filled statusDistribution, top-8 activityByBranch
 * with the §20 live-join names, 30-day zero-filled issuesTrend).
 * An empty account returns all-zero kpis + 4 zero slices + empty
 * series (200 — each surface degrades to its own §60 empty state,
 * §38.6).
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const month = currentEthiopianMonth();
  const { start, end } = ethiopianMonthRange(month.year, month.month);
  const prev = previousEthiopianMonth(month.year, month.month);
  const prevRange = ethiopianMonthRange(prev.year, prev.month);

  const [reportsThisMonth, reportsPrevMonth, generatedThisMonth, generatedPrevMonth, inProgress, generated, activeBranches, statuses, byBranch, issues] =
    await Promise.all([
      Report.countDocuments({ user: userId, isArchived: false, date: { $gte: start, $lt: end } }),
      Report.countDocuments({ user: userId, isArchived: false, date: { $gte: prevRange.start, $lt: prevRange.end } }),
      Report.countDocuments({ user: userId, isArchived: false, status: REPORT_STATUSES[3], date: { $gte: start, $lt: end } }),
      Report.countDocuments({ user: userId, isArchived: false, status: REPORT_STATUSES[3], date: { $gte: prevRange.start, $lt: prevRange.end } }),
      Report.countDocuments({ user: userId, isArchived: false, status: { $in: OPEN_STATES } }),
      Report.countDocuments({ user: userId, isArchived: false, status: REPORT_STATUSES[3] }),
      Branch.countDocuments({ user: userId, isArchived: false }),
      Report.aggregate([
        { $match: { user: userId, isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { user: userId, isArchived: false, branch: { $ne: null } } },
        { $group: { _id: '$branch', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branchRow',
          },
        },
      ]),
      Item.aggregate([
        {
          $match: {
            user: userId,
            type: ITEM_TYPES[1],
            date: { $gte: new Date(Date.now() - TREND_DAYS * 24 * 60 * 60 * 1000) },
          },
        },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
      ]),
    ]);

  const statusCount = new Map(statuses.map((s) => [s._id, s.count]));
  const statusDistribution = REPORT_STATUSES.map((status) => ({ status, count: statusCount.get(status) ?? 0 }));

  const activityByBranch = byBranch
    .map((row) => ({ name: row.branchRow?.[0]?.name ?? '', count: row.count }))
    .filter((row) => row.name !== '');

  const issueCountByDay = new Map(issues.map((row) => [row._id, row.count]));
  const issuesTrend = [];
  const today = new Date();
  for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    issuesTrend.push({ date: key, count: issueCountByDay.get(key) ?? 0 });
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Dashboard data',
    data: {
      kpis: {
        reportsThisMonth,
        inProgress,
        generated,
        activeBranches,
        trends: {
          reportsThisMonthDelta: reportsThisMonth - reportsPrevMonth,
          generatedDelta: generatedThisMonth - generatedPrevMonth,
        },
      },
      charts: {
        statusDistribution,
        activityByBranch,
        issuesTrend,
      },
    },
  });
});

/**
 * GET /analytics/items — the §38.2 item-filter contract: stored Item
 * rows across reports, filters `branch`/`type`/`status`/`dateFrom`/
 * `dateTo`/`q`, §27.6 pagination, default sort date desc +
 * createdAt desc (D29). The `q` filter is a literal-escaped
 * `$regex` over `text` **within the filtered window** (D27 — the
 * `{user, branch, date, type, status}` index bounds the scan; user
 * metacharacters are never interpreted). No model call runs in the
 * loop — one paginated query over Item only.
 */
export const getItems = asyncHandler(async (req, res) => {
  const query = req.validated.query ?? {};
  const filter = { user: req.user._id };

  if (query.branch !== undefined) filter.branch = query.branch;
  if (query.type !== undefined) filter.type = query.type;
  if (query.status !== undefined) filter.status = query.status;
  if (query.dateFrom !== undefined || query.dateTo !== undefined) {
    filter.date = {};
    if (query.dateFrom !== undefined) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo !== undefined) filter.date.$lte = new Date(query.dateTo);
  }
  if (query.q !== undefined && query.q !== '') {
    filter.text = { $regex: escapeRegExp(query.q), $options: 'i' };
  }

  const result = await paginate(
    Item,
    filter,
    {
      page: query.page,
      limit: query.limit,
      sort: { date: -1, createdAt: -1 },
    },
    toItemDto,
  );
  res.status(httpStatus.OK).json({ success: true, message: 'Items', data: result });
});

/**
 * Escapes a user string for a literal `$regex` — every regex
 * metacharacter is neutralized (D27: no user syntax is ever
 * interpreted; the §39.6 `RegExp`-absent-in-search.service.js gate
 * holds — this lives in the analytics controller).
 * @param {string} value - The raw filter term.
 * @returns {string} The literal-escaped term.
 */
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}