/**
 * @module jobs/sweeper
 *
 * The §62 two-pass in-process sweeper (ADR-015, §12.5) — the
 * authority for permanent removal: every §30/§31 DELETE only
 * archives (step 1); removal happens here (step 2). One timer per
 * process (`SWEEPER_INTERVAL_MS`, started after the server is
 * listening — §26.6 — cleared on shutdown; `server.js` owns the
 * lifecycle, this module owns the run).
 *
 * **Pass 1 — expired-archive hard delete (§62.3):** every
 * `isArchived` Report whose `archivedAt` is older than
 * `ARCHIVED_TTL_SECONDS` is removed in its own §27.7 session with
 * its full cascade (Audio docs, the 1:1 Transcription, Item rows,
 * the ChatConversation row); audio binaries are unlinked **after**
 * commit (a missing binary is logged, not retried; an unlink
 * failure is logged and retried by pass 2). Archived branches are
 * removed when the **reference check** clears — no report
 * `branch`/`visits[].branch` and no Item `branch` points at them
 * (D50: archived + unreferenced, no extra window — branch
 * retention is reference-checked, not TTL-windowed, §62.2); a
 * referenced branch is skipped + logged and re-checked on the next
 * run; nothing is removed until the last reference is gone — there
 * is no tombstone path (§17.4).
 *
 * **Pass 2 — the orphan sweep (§62.4):** dependents whose parent no
 * longer exists (the TTL index fired before the sweeper, §18.3 —
 * its deletions run server-side without cascade) and files that
 * never became Audio docs (multer-temp leaks, §32.5) — unlink the
 * orphan files in the §32 temp areas (`uploads/audio/` +
 * `uploads/tmp/`, D49) and remove the parentless docs. The pass
 * never deletes a report or any live parent; every action is logged
 * (§9.5) and nothing throws into request paths (§61.6).
 *
 * Race rules (§62.5): pass 1 before pass 2 within a run; each
 * parent committed before the next; a run over a clean store is a
 * log-only no-op; a crash leaves committed removals and the
 * interrupted parent is retried next run; a `running` guard (D48)
 * prevents overlapping runs.
 */
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import Audio from '../models/audio.model.js';
import Branch from '../models/branch.model.js';
import ChatConversation from '../models/chatConversation.model.js';
import Item from '../models/item.model.js';
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import { logger } from '../utils/logger.js';
import { withTransaction } from '../utils/transaction.js';
import { ARCHIVED_TTL_SECONDS, SWEEPER_INTERVAL_MS } from '../utils/constants.js';

/** The §62 logger child (ADR-019 — no secrets; §9.5). */
const log = logger.child({ label: 'Sweeper' });

/** The §32 temp areas the orphan file pass scans (D49). */
const TEMP_DIRS = ['uploads/audio', 'uploads/tmp'];

let running = false;

/** Best-effort unlink — failures are logged and left for the retry pass. */
function unlinkQuietly(filePath, context) {
  try {
    rmSync(filePath, { force: true });
  } catch (err) {
    log.warn('unlink failed', { context, filePath, error: err.message });
  }
}

/** The §62.3 expired-archive window cutoff. */
function cutoffDate() {
  return new Date(Date.now() - ARCHIVED_TTL_SECONDS * 1000);
}

/**
 * Pass 1 — removes every expired-archived parent (reports with the
 * full cascade + audio unlink-after-commit; branches through the
 * reference check).
 * @returns {Promise<{reports: number, branches: number}>}
 */
async function passOne() {
  let reports = 0;
  let branches = 0;

  const expired = await Report.find({
    isArchived: true,
    archivedAt: { $lt: cutoffDate() },
  }).select('_id');

  for (const report of expired) {
    const audioDocs = await Audio.find({ report: report._id }).select('filePath');
    await withTransaction(async (session) => {
      await Audio.deleteMany({ report: report._id }, { session });
      await Transcription.deleteMany({ report: report._id }, { session });
      await Item.deleteMany({ report: report._id }, { session });
      await ChatConversation.deleteMany({ report: report._id }, { session });
      await Report.deleteOne({ _id: report._id }, { session });
    });
    for (const audio of audioDocs) {
      unlinkQuietly(audio.filePath, 'report-cascade');
    }
    log.info('expired archived report removed', { reportId: report._id.toString() });
    reports += 1;
  }

  const archivedBranches = await Branch.find({ isArchived: true }).select('_id');
  for (const branch of archivedBranches) {
    // The §62.3 reference check — reports (branch or any visit) and
    // Item rows pointing at the branch.
    const references = await Promise.all([
      Report.countDocuments({
        $or: [{ branch: branch._id }, { 'visits.branch': branch._id }],
      }),
      Item.countDocuments({ branch: branch._id }),
    ]);
    const referenceCount = references[0] + references[1];
    if (referenceCount > 0) {
      log.info('archived branch skipped — still referenced', { branchId: branch._id.toString(), referenceCount });
      continue;
    }
    await withTransaction(async (session) => {
      await Branch.deleteOne({ _id: branch._id }, { session });
    });
    log.info('archived branch removed (reference check cleared)', { branchId: branch._id.toString() });
    branches += 1;
  }

  return { reports, branches };
}

/** The files under a temp dir (missing dirs → empty). */
function listFiles(dir) {
  try {
    return readdirSync(dir).map((name) => join(dir, name));
  } catch {
    return [];
  }
}

/**
 * Pass 2 — the orphan sweep (§62.4): parentless dependents (the TTL
 * race) and files that never became Audio docs (multer-temp leaks +
 * failed-unlink leftovers). Never touches a live parent.
 * @returns {Promise<{audios: number, transcriptions: number, conversations: number, files: number}>}
 */
async function passTwo() {
  let audios = 0;
  let transcriptions = 0;
  let conversations = 0;
  let files = 0;

  // Parentless dependents — the TTL index fired before the sweeper
  // (its deletions run without cascade, §18.3/§62.4).
  const orphanAudios = await Audio.aggregate([
    {
      $lookup: { from: 'reports', localField: 'report', foreignField: '_id', as: 'parent' },
    },
    { $match: { parent: { $size: 0 } } },
    { $project: { filePath: 1 } },
  ]);
  for (const audio of orphanAudios) {
    unlinkQuietly(audio.filePath, 'orphan-audio');
    await Audio.deleteOne({ _id: audio._id });
    audios += 1;
  }

  const orphanTranscriptions = await Transcription.aggregate([
    {
      $lookup: { from: 'reports', localField: 'report', foreignField: '_id', as: 'parent' },
    },
    { $match: { parent: { $size: 0 } } },
    { $project: { _id: 1 } },
  ]);
  if (orphanTranscriptions.length > 0) {
    await Transcription.deleteMany({ _id: { $in: orphanTranscriptions.map((t) => t._id) } });
    transcriptions = orphanTranscriptions.length;
  }

  const orphanConversations = await ChatConversation.aggregate([
    {
      $lookup: { from: 'reports', localField: 'report', foreignField: '_id', as: 'parent' },
    },
    { $match: { parent: { $size: 0 } } },
    { $project: { _id: 1 } },
  ]);
  if (orphanConversations.length > 0) {
    await ChatConversation.deleteMany({ _id: { $in: orphanConversations.map((c) => c._id) } });
    conversations = orphanConversations.length;
  }

  // Files that never became Audio docs (multer-temp leaks +
  // failed-unlink leftovers, D49).
  for (const dir of TEMP_DIRS) {
    for (const filePath of listFiles(dir)) {
      const referenced = await Audio.countDocuments({ filePath });
      if (referenced === 0) {
        unlinkQuietly(filePath, 'temp-leak');
        files += 1;
      }
    }
  }

  return { audios, transcriptions, conversations, files };
}

/**
 * Runs one full sweep (pass 1 → pass 2, §62.5). Never throws — the
 * whole run is guarded so a sweeper failure never reaches request
 * paths (§61.6); a clean store is a log-only no-op (§62.5).
 * @returns {Promise<{reports: number, branches: number, audios: number, transcriptions: number, conversations: number, files: number}>}
 */
export async function runSweeper() {
  if (running) {
    log.info('previous run still in progress — skipped');
    return null;
  }
  running = true;
  try {
    const pass1 = await passOne();
    const pass2 = await passTwo();
    log.info('sweep complete', { ...pass1, ...pass2 });
    return { ...pass1, ...pass2 };
  } catch (err) {
    log.error('sweep failed', { error: err.message });
    return null;
  } finally {
    running = false;
  }
}

/** The interval handle — owned by `server.js` (start/clear, §26.6). */
let timer = null;

/** Starts the interval — called after the server is listening (§26.6). */
export function startSweeper() {
  if (timer) return;
  timer = setInterval(() => {
    runSweeper().catch(() => {});
  }, SWEEPER_INTERVAL_MS);
  timer.unref();
  log.info(`sweeper started (every ${SWEEPER_INTERVAL_MS} ms)`);
}

/** Clears the interval — called on shutdown (§26.6). */
export function stopSweeper() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}