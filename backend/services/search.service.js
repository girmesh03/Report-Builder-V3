/**
 * @module services/search-service
 *
 * The §39 global-search engine — the **only** `$text` caller in the
 * backend (the §39.6 grep gate) and the §39.2 index-proof: branches
 * are text-searched over the ONE scoped text index
 * (`{ user, name: 'text', location: 'text' }`, §18.3/§39.2), and
 * reports resolve **through their live branch refs** — a report is
 * found when its `branch` or any `visits[].branch` matches a
 * text-matched branch row (`$in` on the resolved ObjectIds — §21.2
 * reports carry no storable name strings). Transcription content,
 * `date`, and Item text are never indexed (§39.2). No `RegExp` is
 * ever constructed here — `$text` is regex-free by design and the
 * §29 chain sanitizes `q` (trim + quote-strip + 1–100, §39.5).
 *
 * Derived contracts (registered §69, D27–D40): `$text` runs with
 * `$language: 'none'` (no stemming — proper-noun names/locations,
 * D28); ranking within each group is text-score desc (branches tie
 * `name` asc, reports tie `date` desc, §39.4), the merged order is
 * branches-group first then reports-group (D37 — pagination is the
 * manual §27.4 slicing over the two-source merged list);
 * `matchedFields` is derived post-query — the matched branch's
 * `name`/`location` fields containing the `q` literal (D40; `$text`
 * returns the score, never the matched field); null-date reports
 * stay in results with `title: ''` (D39, BR-19); `includeArchived`
 * widens both sources (D36).
 */
import Branch from '../models/branch.model.js';
import Report from '../models/report.model.js';
import { formatEthiopianDate } from '../utils/ethiopianDate.js';

/**
 * Runs the §39.3 search and returns the §27.4 merged shape.
 * @param {{ userId: string, q: string, page: number, limit: number, type?: 'report'|'branch', includeArchived: boolean }} params — `q` already sanitized by the §29 chain (trimmed, quotes stripped, 1–100).
 * @returns {Promise<{ docs: object[], page: number, limit: number, totalDocs: number, totalPages: number }>}
 */
export async function search({ userId, q, page, limit, type, includeArchived }) {
  const branchFilter = { user: userId, $text: { $search: q, $language: 'none' } };
  if (!includeArchived) branchFilter.isArchived = false;

  const matchedBranches = await Branch.find(
    branchFilter,
    { score: { $meta: 'textScore' } },
  )
    .sort({ score: { $meta: 'textScore' }, name: 1 })
    .lean();

  const branchDocs = [];
  const matchedById = new Map();
  for (const branch of matchedBranches) {
    matchedById.set(branch._id.toString(), branch);
    branchDocs.push({
      type: 'branch',
      entityId: branch._id,
      title: branch.name,
      subtitle: branch.location ?? '',
      matchedFields: matchedFieldsOf(branch, q),
    });
  }

  let reportDocs = [];
  if (matchedBranches.length > 0) {
    const matchedIds = matchedBranches.map((b) => b._id);
    const reportFilter = {
      user: userId,
      $or: [{ branch: { $in: matchedIds } }, { 'visits.branch': { $in: matchedIds } }],
    };
    if (!includeArchived) reportFilter.isArchived = false;

    const reports = await Report.find(reportFilter).sort({ date: -1, createdAt: -1 }).lean();
    const scoreOf = new Map(matchedBranches.map((b) => [b._id.toString(), b.score ?? 0]));

    // The subtitle is the report's OWN branch name (§39.3: "the
    // report's branch name (the matched one, or the report's own
    // branch when the match came from a visit)") — resolve names for
    // the own branches not already in the matched set (a visit match
    // can resolve against a report whose own branch did not match).
    const ownIds = [...new Set(reports.map((r) => r.branch?.toString()).filter(Boolean))];
    const ownNotMatched = ownIds.filter((id) => !matchedById.has(id));
    const ownBranches = ownNotMatched.length > 0
      ? await Branch.find({ user: userId, _id: { $in: ownNotMatched } }).lean()
      : [];
    const nameOf = (id) => matchedById.get(id?.toString())?.name ?? ownBranches.find((b) => b._id.toString() === id?.toString())?.name ?? '';

    const resolvingBranchOf = (report) => {
      if (matchedById.has(report.branch?.toString())) {
        return matchedById.get(report.branch.toString());
      }
      return report.visits
        ?.map((v) => matchedById.get(v.branch?.toString()))
        .find((b) => b !== undefined) ?? null;
    };
    reportDocs = reports
      .map((report) => {
        const resolving = resolvingBranchOf(report);
        return {
          report,
          resolving,
          score: resolving ? scoreOf.get(resolving._id.toString()) ?? 0 : 0,
        };
      })
      .filter((entry) => entry.resolving !== null)
      .sort((a, b) => b.score - a.score || new Date(b.report.date ?? 0) - new Date(a.report.date ?? 0))
      .map(({ report, resolving }) => ({
        type: 'report',
        entityId: report._id,
        title: formatEthiopianDate(report.date) ?? '',
        subtitle: nameOf(report.branch),
        status: report.status,
        matchedFields: matchedFieldsOf(resolving, q),
      }));
  }

  const merged = [];
  if (type === 'branch') merged.push(...branchDocs);
  else if (type === 'report') merged.push(...reportDocs);
  else merged.push(...branchDocs, ...reportDocs);

  const totalDocs = merged.length;
  const totalPages = Math.ceil(totalDocs / limit);
  const start = (page - 1) * limit;
  const docs = merged.slice(start, start + limit);

  return { docs, page, limit, totalDocs, totalPages };
}

/**
 * Derives `matchedFields` (D40): the index fields of the matched
 * branch whose value contains the `q` literal (case-insensitive —
 * with `$language: 'none'` a `$text` word match is a literal
 * substring). A multi-word `q` whose terms split across fields falls
 * back to both index fields (the honest OR-match answer).
 * @param {object} branch - The lean matched branch row.
 * @param {string} q - The sanitized search term.
 * @returns {string[]}
 */
export function matchedFieldsOf(branch, q) {
  const needle = String(q ?? '').toLowerCase();
  const fields = [];
  if (String(branch.name ?? '').toLowerCase().includes(needle)) fields.push('name');
  if (String(branch.location ?? '').toLowerCase().includes(needle)) fields.push('location');
  return fields.length > 0 ? fields : ['name', 'location'];
}