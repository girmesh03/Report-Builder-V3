/**
 * @module controllers/audio
 *
 * The §32 audio surface: upload (§32.2 — multipart `clip` +
 * `language`; MIME/size/duration gates; the first-clip
 * `draft → audio_attached` transition), listing (§32.3, paginated
 * asc createdAt), metadata, authenticated range streaming (§32.3 —
 * the browser audio element), and deletion with the §31.4 rewind
 * rule (§32.4: last-clip rewind to `draft`; at `transcribed` the
 * 1:1 Transcription row cascades and the report's ref clears;
 * frozen 403 at `generated`). Files land under
 * `backend/uploads/audio/` (gitignored, multer destination),
 * filename `{reportId}-{timestamp}{ext}` — no user input in names
 * (§32.2); the binding is written in the same §27.7 session that
 * inserts the Audio doc. `filePath` never reaches a client (DTO
 * gate, §22.7); the physical unlink happens only after commit
 * (§32.4/§32.5); anything leaked beyond a request is the §62
 * orphan sweep's second pass.
 */
import { createReadStream, statSync, unlinkSync, mkdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import { env } from '../config/env.js';
import Audio from '../models/audio.model.js';
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import { httpStatus } from '../utils/httpStatus.js';
import { CustomError } from '../utils/errors.js';
import { paginate } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import {
  AUDIO_ALLOWED_MIME_TYPES,
  AUDIO_MAX_DURATION_SEC,
  AUDIO_MAX_SIZE_BYTES,
  REPORT_STATUSES,
} from '../utils/constants.js';

const execFileAsync = promisify(execFile);

/** ADR-017: the AudioDto is the model's serialized surface (§32.7 — `filePath` stripped by the transform). */
const toAudioDto = (doc) => doc.toJSON();

const AUDIO_DIR = 'uploads/audio';

/** §32.2 — extension map for the sanitized filename (never user input). */
const EXTENSION_BY_MIME = {
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/mp4': '.m4a',
  'audio/webm': '.webm',
};

/** The §31.4 frozen-at-generated copy (BR-12 — audio addition/removal is frozen). */
const GENERATED_FROZEN = 'This report is already generated — audio is frozen';

/** The §32.2 video rejection copy (BR-02 — the product records voice only). */
const VIDEO_REJECTED = 'Only audio recordings are supported';

/**
 * Probes a file's duration via ffprobe (§32.2 — the §29 chain
 * enforces the file, multer's `limits` enforce size, ffprobe
 * enforces the duration cap).
 * @param {string} filePath - The uploaded file.
 * @returns {Promise<number>} Duration in seconds.
 */
async function probeDuration(filePath) {
  try {
    const { stdout } = await execFileAsync(env.FFPROBE_PATH, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const seconds = Number(stdout.trim());
    if (!Number.isFinite(seconds) || seconds < 0) return null;
    return seconds;
  } catch {
    return null;
  }
}

/**
 * The clip multer — disk storage under `uploads/audio/`, MIME
 * allowlist with the §32.2 video rejection, size cap via multer
 * limits (the LIMIT_FILE_SIZE error maps to 422 in
 * `utils/errors.js`). Exported for the §33 transcripts endpoint
 * (the same clip gates, §31.6).
 */
export const clipUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      mkdirSync(AUDIO_DIR, { recursive: true });
      cb(null, AUDIO_DIR);
    },
    filename: (req, file, cb) => {
      const reportId = req.params.reportId ?? req.body?.reportId ?? 'staged';
      cb(null, `${reportId}-${Date.now()}${EXTENSION_BY_MIME[file.mimetype] ?? ''}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const baseType = String(file.mimetype).split(';')[0];
    if (baseType.startsWith('video/')) {
      cb(new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
        { field: 'clip', message: VIDEO_REJECTED },
      ]));
      return;
    }
    if (!AUDIO_ALLOWED_MIME_TYPES.includes(baseType)) {
      cb(new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
        { field: 'clip', message: 'Only audio files are accepted' },
      ]));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: AUDIO_MAX_SIZE_BYTES },
});

/**
 * POST /reports/:reportId/clips — upload (§32.2): 201 AudioDto; the
 * first clip of the report triggers `draft → audio_attached`
 * (§31.4); frozen 403 at `generated`; the duration cap is
 * ffprobe-enforced in the controller; the uploaded file is unlinked
 * on any failure in the same request (finally, §32.5).
 */
export const uploadClip = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  if (report.status === REPORT_STATUSES[3]) {
    next(new CustomError('FORBIDDEN', GENERATED_FROZEN));
    return;
  }

  const file = req.file;
  if (!file) {
    next(new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
      { field: 'clip', message: 'Attach an audio recording' },
    ]));
    return;
  }

  const filePath = file.path;
  try {
    const duration = await probeDuration(filePath);
    if (duration === null || duration > AUDIO_MAX_DURATION_SEC) {
      throw new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
        { field: 'clip', message: 'The recording is too long' },
      ]);
    }

    const audio = await withTransaction(async (session) => {
      const [created] = await Audio.create(
        [
          {
            user: req.user._id,
            report: report._id,
            filePath,
            mimeType: file.mimetype.split(';')[0],
            sizeBytes: file.size,
            durationSec: Math.round(duration),
          },
        ],
        { session },
      );
      if (report.status === REPORT_STATUSES[0]) {
        await Report.updateOne(
          { _id: report._id, user: req.user._id },
          { $set: { status: REPORT_STATUSES[1] } },
          { session },
        );
      }
      return created;
    });

    res.status(httpStatus.CREATED).json({ success: true, message: 'Clip uploaded', data: toAudioDto(audio) });
  } catch (err) {
    unlinkQuietly(resolve(filePath));
    next(err);
  }
});

/** Best-effort file cleanup (two-phase write hygiene, §32.5). */
function unlinkQuietly(filePath) {
  try {
    unlinkSync(filePath);
  } catch {
    // Leftover files are harmless; the upload dir is gitignored.
  }
}

/**
 * GET /reports/:reportId/clips — paginated list, ordered by
 * `createdAt` asc (§32.3); empty list → `docs: []` (no 404).
 */
export const listClips = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  const query = req.validated.query ?? {};
  const result = await paginate(
    Audio,
    { user: req.user._id, report: report._id },
    { page: query.page, limit: query.limit, sort: { createdAt: 1, _id: 1 } },
    toAudioDto,
  );
  res.status(httpStatus.OK).json({ success: true, message: 'Clips', data: result });
});

/** GET /audios/:audioId — metadata AudioDto (§32.3); 404 for not-owned (BR-13). */
export const getClip = asyncHandler(async (req, res, next) => {
  const audio = await Audio.findOne({ _id: req.params.audioId, user: req.user._id });
  if (!audio) {
    next(new CustomError('NOT_FOUND', 'Audio not found'));
    return;
  }
  res.status(httpStatus.OK).json({ success: true, message: 'Clip', data: toAudioDto(audio) });
});

/**
 * GET /audios/:audioId/play — authenticated HTTP range streaming
 * (§32.3): `Content-Type: mimeType`, `Accept-Ranges: bytes`,
 * `Cache-Control: private`; 404 when the physical file is missing
 * (the doc's binary already cleaned — §32.5 edge).
 */
export const playClip = asyncHandler(async (req, res, next) => {
  const audio = await Audio.findOne({ _id: req.params.audioId, user: req.user._id });
  if (!audio) {
    next(new CustomError('NOT_FOUND', 'Audio not found'));
    return;
  }

  const filePath = resolve(audio.filePath);
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    next(new CustomError('NOT_FOUND', 'The audio file is missing'));
    return;
  }

  res.set('Content-Type', audio.mimeType);
  res.set('Accept-Ranges', 'bytes');
  res.set('Cache-Control', 'private');

  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    let start;
    let end;
    if (match && match[1] !== '' && match[2] !== '') {
      [start, end] = [parseInt(match[1], 10), parseInt(match[2], 10)];
    } else if (match && match[1] !== '') {
      // `bytes=start-` — open-ended: to the end of the resource.
      start = parseInt(match[1], 10);
      end = stat.size - 1;
    } else if (match && match[2] !== '') {
      // `bytes=-N` — RFC 7233 suffix form: the last N bytes.
      const suffix = parseInt(match[2], 10);
      start = Math.max(stat.size - suffix, 0);
      end = stat.size - 1;
    } else {
      start = 0;
      end = stat.size - 1;
    }
    if (start >= stat.size || start > end) {
      res.status(httpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).set('Content-Range', `bytes */${stat.size}`).end();
      return;
    }
    res.status(httpStatus.PARTIAL_CONTENT);
    res.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.set('Content-Length', String(end - start + 1));
    createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.status(httpStatus.OK);
  res.set('Content-Length', String(stat.size));
  createReadStream(filePath).pipe(res);
});

/**
 * DELETE /audios/:audioId — §32.4: removes the Audio doc and applies
 * the §31.4 rewind: deleting the last clip of an `audio_attached`
 * report → `draft`; deleting any clip of a `transcribed` report
 * cascades the 1:1 Transcription row + clears the report's ref and
 * rewinds to `audio_attached` (or `draft` when it was the last);
 * frozen 403 at `generated`; the physical file is unlinked only
 * after commit (§32.4/§32.5).
 */
export const deleteClip = asyncHandler(async (req, res, next) => {
  const audio = await Audio.findOne({ _id: req.params.audioId, user: req.user._id });
  if (!audio) {
    next(new CustomError('NOT_FOUND', 'Audio not found'));
    return;
  }

  const result = await withTransaction(async (session) => {
    const report = await Report.findOne({ _id: audio.report, user: req.user._id }).session(session);
    if (!report) throw new CustomError('NOT_FOUND', 'Report not found');
    if (report.status === REPORT_STATUSES[3]) {
      throw new CustomError('FORBIDDEN', GENERATED_FROZEN);
    }

    const remaining = await Audio.countDocuments({ user: req.user._id, report: report._id, _id: { $ne: audio._id } }).session(session);
    const isLast = remaining === 0;

    await Audio.deleteOne({ _id: audio._id, user: req.user._id }, { session });

    let status = report.status;
    if (report.status === REPORT_STATUSES[2]) {
      await Transcription.deleteOne({ user: req.user._id, report: report._id }, { session });
      status = isLast ? REPORT_STATUSES[0] : REPORT_STATUSES[1];
      await Report.updateOne(
        { _id: report._id, user: req.user._id },
        { $set: { status, transcription: null } },
        { session },
      );
    } else if (report.status === REPORT_STATUSES[1] && isLast) {
      status = REPORT_STATUSES[0];
      await Report.updateOne(
        { _id: report._id, user: req.user._id },
        { $set: { status } },
        { session },
      );
    }

    return { filePath: audio.filePath, status };
  });

  unlinkQuietly(resolve(result.filePath));

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Clip deleted',
    data: null,
  });
});