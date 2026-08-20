/**
 * @module controllers/transcription
 *
 * The §33 transcription surface: the STT write
 * (`PUT /reports/:reportId/transcription` — create-or-replace,
 * ADR-030, ai tier), the read (`GET` — global tier), and the STT-only
 * correction-dialog endpoint (`POST …/corrections/transcripts` — ai
 * tier, §31.6/§33.8: ephemeral clip, nothing persisted). The heavy
 * lifting lives in `services/stt.service.js` (the only layer calling
 * addis — §33.9); the controller applies the §31.4 status gates and
 * maps the progress/error surfaces. The transcription DTO is the
 * model's serialized surface — the D8 ledger `stt.audios` is
 * excluded by the transform (§23.7, D21).
 */
import { unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import asyncHandler from 'express-async-handler';
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import { httpStatus } from '../utils/httpStatus.js';
import { CustomError } from '../utils/errors.js';
import { AUDIO_MAX_SIZE_BYTES } from '../utils/constants.js';
import { transcribeReport, transcribeEphemeralClip } from '../services/stt.service.js';
import { clipUpload } from './audio.controller.js';

/** ADR-017: the TranscriptionDto is the model's serialized surface (§33.8). */
const toTranscriptionDto = (doc) => doc.toJSON();

/**
 * PUT /reports/:reportId/transcription — the §33.8 STT write (ai
 * tier): 200 TranscriptionDto on full success; a partial chunk
 * failure returns 200 with `{ completed, failed }` progress and NO
 * status advance (§33.7 — nothing persisted); 422 no audios /
 * all already transcribed; 403 archived or `generated`; 502 on
 * provider-level failure.
 */
export const putTranscription = asyncHandler(async (req, res, next) => {
  const result = await transcribeReport({
    reportId: req.params.reportId,
    userId: req.user._id,
  });

  if (result.failed.length > 0) {
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Partial transcription',
      data: {
        completed: result.completed,
        failed: result.failed.map((f) => ({ audioId: f.audioId.toString(), reason: f.reason })),
      },
    });
    return;
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Transcription ready',
    data: toTranscriptionDto(result.transcription),
  });
});

/**
 * GET /reports/:reportId/transcription — 200 TranscriptionDto;
 * 404 "No transcription yet" when the report has none (§33.8).
 */
export const getTranscription = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  const transcription = await Transcription.findOne({ user: req.user._id, report: report._id });
  if (!transcription) {
    next(new CustomError('NOT_FOUND', 'No transcription yet'));
    return;
  }
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Transcription',
    data: toTranscriptionDto(transcription),
  });
});

/**
 * POST /reports/:reportId/corrections/transcripts — the round-7
 * STT-only endpoint of the correction dialog (§31.6/§33.8, ai
 * tier): the multipart `clip` is transcribed through the §33
 * pipeline and the instruction TEXT returned — the engine never
 * runs, the report is never mutated, nothing is stored (the dialog
 * fills its field; Apply sends the typed instruction through
 * `/corrections`). Guards: 404 unknown/foreign report, 403 archived,
 * 422 missing clip ("Record a voice instruction first") / disallowed
 * MIME ("Only audio files are accepted") / size cap; the clip is
 * ephemeral (unlinked in the same request — never an Audio row,
 * §35.6).
 */
export const transcribeInstruction = asyncHandler(async (req, res, next) => {
  const report = await Report.findOne({ _id: req.params.reportId, user: req.user._id });
  if (!report) {
    next(new CustomError('NOT_FOUND', 'Report not found'));
    return;
  }
  if (report.isArchived) {
    next(new CustomError('FORBIDDEN', 'This report is archived'));
    return;
  }

  const file = req.file;
  if (!file) {
    next(new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
      { field: 'clip', message: 'Record a voice instruction first' },
    ]));
    return;
  }
  if (file.size > AUDIO_MAX_SIZE_BYTES) {
    unlinkQuietly(resolve(file.path));
    next(new CustomError('UNPROCESSABLE_ENTITY', 'Check the highlighted fields', [
      { field: 'clip', message: 'The recording is too large' },
    ]));
    return;
  }

  try {
    const { text } = await transcribeEphemeralClip({ filePath: file.path });
    res.status(httpStatus.OK).json({ success: true, message: 'Transcript ready', data: { text } });
  } catch (err) {
    next(err);
  } finally {
    unlinkQuietly(resolve(file.path));
  }
});

/** Best-effort file cleanup (§32.5 — the mode-3 clip is ephemeral). */
function unlinkQuietly(filePath) {
  try {
    unlinkSync(filePath);
  } catch {
    // Leftover files are harmless; the upload dir is gitignored.
  }
}

/** The §32 clip gates for the transcripts route (re-export). */
export { clipUpload };