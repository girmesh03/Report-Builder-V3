/**
 * @module mock/seed
 *
 * The §40 seed — the deterministic development fixture injection
 * (ADR-037, §25.3/§40.2): upserts the two §25.3 accounts (dev-only
 * placeholder hashes — they can never authenticate, §40.2) and
 * writes the canonical fixture set for the **current user** —
 * branches (3 active + 1 archived, D42), one report per status
 * with §17.6-presence-valid rows, metadata-only audio (the §25
 * `mock/` path convention — no physical files), the 1:1
 * transcriptions (`raw` = `latest` verbatim §6.8 bodies),
 * the 12 Item rows on the generated fixture, and the register-valid
 * mock conversation (D43) — plus the D45/D52 BR-13 probe scope for
 * the second mock account (1 branch + 1 draft report, the Sample-4
 * day).
 *
 * **Self-replacing idempotency (D46/D47, registered):** the seed
 * first removes the existing mock scopes (the caller's via the D41
 * signature, the probe account's via the probe signature) **inside
 * the same §27.7 session**, then injects — so re-seeding always
 * yields exactly one canonical set (no duplicates, no unique-index
 * collisions — §40.3's parenthetical; the result state equals the
 * canonical fixture set per §25.4). The §40.6 "seed after wipe →
 * zeros" clause is recorded as ambiguous prose (D47); its normative
 * core — deterministic 200s, never errors — is honored.
 */
import User from '../models/user.model.js';
import Branch from '../models/branch.model.js';
import Report from '../models/report.model.js';
import Audio from '../models/audio.model.js';
import Transcription from '../models/transcription.model.js';
import Item from '../models/item.model.js';
import ChatConversation from '../models/chatConversation.model.js';
import { withTransaction } from '../utils/transaction.js';
import { REPORT_STATUSES } from '../utils/constants.js';
import {
  MOCK_PATH_PREFIX,
  MOCK_USERS,
  MOCK_BRANCHES,
  MOCK_AUDIOS,
  MOCK_ITEMS,
  MOCK_CONVERSATION,
  DRAFT_DAY,
  SAMPLE_1_DAY,
  SAMPLE_2_DAY,
  SAMPLE_3_DAY,
  PROBE_BRANCH,
  PROBE_DAY,
  SAMPLE_2_BODY,
  SAMPLE_3_BODY,
  assertRegisterValidTriples,
} from './fixtures.js';
import { wipeMockScope } from './wipe.js';

/**
 * Upserts the §25.3 accounts — created via `User.create` (the §19
 * hash hook runs on save; a `findOneAndUpdate` upsert would bypass
 * it) — found accounts are skipped (never overwritten; re-runs are
 * collision-free).
 * @returns {Promise<{ users: number, accounts: object[] }>}
 */
async function upsertMockUsers(session) {
  for (const userFixture of MOCK_USERS) {
    const existing = await User.findOne({ email: userFixture.email }).session(session);
    if (!existing) {
      await User.create([{ ...userFixture }], { session, ordered: true });
    }
  }
  const accounts = await User.find({ email: { $in: MOCK_USERS.map((u) => u.email) } }).select('_id email').session(session);
  return { accounts };
}

/** The canonical report fixtures (one per §11.4 status, D51). */
function buildReportFixtures(userId, branchIdOf) {
  const dateOf = (day) => day.date;

  return [
    {
      // draft — capture-only (Sample-3's main branch; no content surface, §17.6).
      user: userId,
      date: dateOf(DRAFT_DAY),
      branch: branchIdOf('መድኃኒዓለም'),
      clockIn: DRAFT_DAY.clockIn,
      clockOut: DRAFT_DAY.clockOut,
      visits: DRAFT_DAY.visits.map((v) => ({ branch: branchIdOf(v.branch), clockIn: v.clockIn, clockOut: v.clockOut })),
      status: REPORT_STATUSES[0],
    },
    {
      // audio_attached — Sample-1's Type-2 day (two branches) + audio rows.
      user: userId,
      date: dateOf(SAMPLE_1_DAY),
      branch: branchIdOf('መድኃኒዓለም'),
      clockIn: SAMPLE_1_DAY.clockIn,
      clockOut: SAMPLE_1_DAY.clockOut,
      visits: SAMPLE_1_DAY.visits.map((v) => ({ branch: branchIdOf(v.branch), clockIn: v.clockIn, clockOut: v.clockOut })),
      status: REPORT_STATUSES[1],
    },
    {
      // transcribed — Sample-3's Type-1 day + the 1:1 transcription.
      user: userId,
      date: dateOf(SAMPLE_3_DAY),
      branch: branchIdOf('መድኃኒዓለም'),
      clockIn: SAMPLE_3_DAY.clockIn,
      clockOut: SAMPLE_3_DAY.clockOut,
      visits: SAMPLE_3_DAY.visits.map((v) => ({ branch: branchIdOf(v.branch), clockIn: v.clockIn, clockOut: v.clockOut })),
      status: REPORT_STATUSES[2],
    },
    {
      // generated — Sample-2's Type-2 day (three branches) + content + Item rows + the conversation.
      user: userId,
      date: dateOf(SAMPLE_2_DAY),
      branch: branchIdOf('ኤርፖርት'),
      clockIn: SAMPLE_2_DAY.clockIn,
      clockOut: SAMPLE_2_DAY.clockOut,
      visits: SAMPLE_2_DAY.visits.map((v) => ({ branch: branchIdOf(v.branch), clockIn: v.clockIn, clockOut: v.clockOut })),
      status: REPORT_STATUSES[3],
    },
  ];
}

/**
 * The §40.2 seed endpoint body — one session (ADR-018): self-replace
 * (D46) → upsert the accounts → inject the canonical set in the
 * §25.4 dependency order (users → branches → reports → audio →
 * transcriptions → conversations) → the seeded counts.
 * @param {string} userId - The caller (the fixture owner).
 * @returns {Promise<{seeded: {users: number, branches: number, reports: number, audios: number, transcriptions: number, items: number, conversations: number}}>}
 */
export async function seed(userId) {
  assertRegisterValidTriples();

  return withTransaction(async (session) => {
    // D46 — self-replacing: remove the existing mock scopes first.
    await wipeMockScope(userId, session);
    const knownProbe = await User.findOne({ email: MOCK_USERS[1].email }).select('_id').session(session);
    if (knownProbe) {
      await wipeMockScope(knownProbe._id.toString(), session);
    }

    // §25.4 dependency order — users first (the upsert; the persona
    // account is never the caller's own — it may exist).
    const { accounts } = await upsertMockUsers(session);
    const probeUser = accounts.find((u) => u.email === MOCK_USERS[1].email) ?? null;

    // Branches — 3 active + 1 archived (D42); the archived row
    // carries the lifecycle-consistent archivedAt.
    const branchDocs = await Branch.create(
      MOCK_BRANCHES.map((b) => ({
        user: userId,
        name: b.name,
        location: b.location,
        isArchived: b.isArchived,
        archivedAt: b.isArchived ? new Date() : undefined,
      })),
      { session, ordered: true },
    );
    const branchIdOf = (name) => branchDocs.find((b) => b.name === name)._id;

    // Reports — one per status.
    const reportDocs = await Report.create(
      buildReportFixtures(userId, branchIdOf),
      { session, ordered: true },
    );
    const reportIdOf = (status) => reportDocs.find((r) => r.status === status)._id;

    // Audio — metadata-only, the §25 mock-path convention (no files).
    const audioRows = MOCK_AUDIOS.map((a) => ({
      user: userId,
      report: reportIdOf(a.reportStatus),
      filePath: `${MOCK_PATH_PREFIX}audio-${a.suffix}.webm`,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      durationSec: a.durationSec,
    }));
    await Audio.create(audioRows, { session, ordered: true });

    // Transcriptions — raw = latest, verbatim §6.8 bodies (§25.2 rule 3).
    const transcriptionDocs = await Transcription.create(
      [
        { user: userId, report: reportIdOf(REPORT_STATUSES[2]), raw: SAMPLE_3_BODY, latest: SAMPLE_3_BODY, language: 'am' },
        { user: userId, report: reportIdOf(REPORT_STATUSES[3]), raw: SAMPLE_2_BODY, latest: SAMPLE_2_BODY, language: 'am' },
      ],
      { session, ordered: true },
    );
    // The §21.8 circular pair — the reports carry their 1:1 refs.
    for (const t of transcriptionDocs) {
      await Report.updateOne({ _id: t.report, user: userId }, { $set: { transcription: t._id } }, { session });
    }

    // Items — the 12 rows on the generated fixture (§24A).
    const generatedId = reportIdOf('generated');
    const generatedBranch = reportDocs.find((r) => r.status === 'generated').branch;
    const generatedDate = reportDocs.find((r) => r.status === 'generated').date;
    await Item.create(
      MOCK_ITEMS.map((item) => ({
        user: userId,
        report: generatedId,
        branch: generatedBranch,
        date: generatedDate,
        type: item.type,
        text: item.text,
        status: item.status ?? null,
        rating: item.rating ?? null,
      })),
      { session, ordered: true },
    );

    // The mock conversation (D43 — on the generated report).
    await ChatConversation.create(
      [{ user: userId, report: generatedId, reasoning: MOCK_CONVERSATION.reasoning, messages: MOCK_CONVERSATION.messages }],
      { session, ordered: true },
    );

    // D45/D52 — the BR-13 probe scope for the second account (its
    // own branch + the Sample-4 draft day; the probe's idempotency
    // is the self-replacing wipe above).
    if (probeUser) {
      const probeBranch = await Branch.create(
        [{ user: probeUser._id, name: PROBE_BRANCH.name, location: PROBE_BRANCH.location }],
        { session },
      );
      await Report.create(
        [{
          user: probeUser._id,
          date: PROBE_DAY.date,
          branch: probeBranch[0]._id,
          clockIn: PROBE_DAY.clockIn,
          clockOut: PROBE_DAY.clockOut,
          visits: PROBE_DAY.visits.map((v) => ({ branch: probeBranch[0]._id, clockIn: v.clockIn, clockOut: v.clockOut })),
          status: 'draft',
        }],
        { session },
      );
    }

    return {
      seeded: {
        users: MOCK_USERS.length,
        branches: branchDocs.length,
        reports: reportDocs.length,
        audios: audioRows.length,
        transcriptions: 2,
        items: MOCK_ITEMS.length,
        conversations: 1,
      },
    };
  });
}