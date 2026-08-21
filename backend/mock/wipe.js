/**
 * @module mock/wipe
 *
 * The §40 wipe — the deterministic reset of the development loop
 * (ADR-037, §25.4): removes the caller's mock rows through the
 * **§25 fixture signature** (D41 — registered in §69): audio rows
 * whose `filePath` carries the `mock/` path prefix; branches whose
 * `name` is a seeded fixture name; reports on those branches with a
 * fixture date; transcriptions/items/conversations scoped by those
 * report ids. Real rows are untouched (a real row sharing the exact
 * fixture date on a fixture-named branch is the accepted signature
 * boundary). The whole delete set commits atomically in one §27.7
 * session (ADR-018); wipe without seed returns zeros (200, never an
 * error — §40.6). The mock user fixtures are removed only when they
 * are not the caller (D44 — never deleting the logged-in account),
 * after their own rows are gone (the skip-when-referenced clause is
 * vacuous today — no cross-user references exist in the closed
 * models — and stays defensive). `wipeMockScope` is shared with the
 * seed's self-replacing step (D46).
 */
import User from '../models/user.model.js';
import Branch from '../models/branch.model.js';
import Report from '../models/report.model.js';
import Audio from '../models/audio.model.js';
import Transcription from '../models/transcription.model.js';
import Item from '../models/item.model.js';
import ChatConversation from '../models/chatConversation.model.js';
import { withTransaction } from '../utils/transaction.js';
import {
  MOCK_PATH_PREFIX,
  MOCK_BRANCHES,
  MOCK_USERS,
  DRAFT_DAY,
  SAMPLE_1_DAY,
  SAMPLE_2_DAY,
  SAMPLE_3_DAY,
} from './fixtures.js';

/** The seeded branch-name set (the §25 signature vocabulary). */
const MOCK_BRANCH_NAMES = MOCK_BRANCHES.map((b) => b.name);

/** The seeded report-date set (the §25 signature vocabulary, D41). */
const MOCK_REPORT_DATES = [DRAFT_DAY.date, SAMPLE_1_DAY.date, SAMPLE_2_DAY.date, SAMPLE_3_DAY.date];

/** The mock-user emails (the D44 wipe target). */
const MOCK_USER_EMAILS = MOCK_USERS.map((u) => u.email);

/**
 * Removes one user's mock scope by the §25 signature (D41) —
 * shared by the wipe endpoint and the seed's self-replacing step.
 * @param {string} userId - The scope owner.
 * @param {import('mongoose').ClientSession} session - The caller's session.
 * @returns {Promise<{branches: number, reports: number, audios: number, transcriptions: number, items: number, conversations: number}>}
 */
export async function wipeMockScope(userId, session) {
  // Sequential in-transaction reads (Atlas serverless rejects
  // parallel cursors inside a transaction — verified 2026-08-20;
  // §40.4's session-safety is the contract, the reads stay simple).
  const audios = await Audio.find({ user: userId, filePath: { $regex: `^${MOCK_PATH_PREFIX}` } }).select('_id').session(session);
  const branches = await Branch.find({ user: userId, name: { $in: MOCK_BRANCH_NAMES } }).select('_id').session(session);
  const branchIds = branches.map((b) => b._id);

  const reports = branchIds.length > 0
    ? await Report.find({ user: userId, branch: { $in: branchIds }, date: { $in: MOCK_REPORT_DATES } }).select('_id').session(session)
    : [];
  const reportIds = reports.map((r) => r._id);

  const counts = {
    branches: 0,
    reports: 0,
    audios: 0,
    transcriptions: 0,
    items: 0,
    conversations: 0,
  };

  if (audios.length > 0) {
    counts.audios = (await Audio.deleteMany({ _id: { $in: audios.map((a) => a._id) } }, { session })).deletedCount;
  }
  if (branchIds.length > 0) {
    counts.branches = (await Branch.deleteMany({ _id: { $in: branchIds } }, { session })).deletedCount;
  }
  if (reportIds.length > 0) {
    counts.reports = (await Report.deleteMany({ _id: { $in: reportIds } }, { session })).deletedCount;
    counts.transcriptions = (await Transcription.deleteMany({ user: userId, report: { $in: reportIds } }, { session })).deletedCount;
    counts.items = (await Item.deleteMany({ user: userId, report: { $in: reportIds } }, { session })).deletedCount;
    counts.conversations = (await ChatConversation.deleteMany({ user: userId, report: { $in: reportIds } }, { session })).deletedCount;
  }

  return counts;
}

/**
 * The §40.2 wipe endpoint body — one session: the caller's mock
 * scope + the D44 user-fixture guard (never the caller's own
 * account).
 * @param {string} userId - The caller.
 * @returns {Promise<{users: number, branches: number, reports: number, audios: number, transcriptions: number, items: number, conversations: number}>}
 */
export async function wipe(userId) {
  return withTransaction(async (session) => {
    const scope = await wipeMockScope(userId, session);
    const users = (await User.deleteMany(
      { email: { $in: MOCK_USER_EMAILS }, _id: { $ne: userId } },
      { session },
    )).deletedCount;
    return { users, ...scope };
  });
}