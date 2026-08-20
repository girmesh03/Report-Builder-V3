/**
 * @module services/stt-service
 *
 * The §33 STT pipeline — the **only layer calling `addis`** (the
 * §33.9 grep gate; the §16.3/§16.7 SDK instance) and the owner of
 * the report's 1:1 Transcription row (§23, ADR-030). `PUT
 * /reports/:reportId/transcription` creates-or-replaces the row
 * (idempotent REST form, §33.6): the service walks the report's
 * audios in `createdAt` order (§32.3), skips audios already in the
 * **merge ledger** (`stt.audios` — the D8 cross-call skip: an
 * audio in the ledger is already-succeeded and never re-heard),
 * splits each pending audio via `utils/wavSplitter` (§33.3,
 * `ADDIS_AI_STT_MAX_DURATION_SEC` chunks), transcribes every chunk
 * with addis (a failed chunk is marked failed and the pipeline
 * continues — §33.4/§16.5), and merges into the single row.
 *
 * **No-partial-merge rule (§33.7/§23.4/F89-2):** the row is
 * persisted only when *every* chunk of *every* pending audio
 * succeeded — otherwise the response is the progress surface
 * `{ completed, failed: [{ audioId, reason }] }` with no write and
 * no status change; a re-call re-runs only the failed/pending
 * audios. The merge (§33.3/§33.5): single-space join in ascending
 * `createdAt`/`_id` order (D17); re-transcription joins
 * `[current raw, ...newTexts]` (D8); empty segments contribute
 * nothing (D18); an all-empty result persists `''` as a valid
 * result (§33.7). `latest` initializes equal to `raw` — wrapped as
 * content HTML (§33.8, §23.2 dual-phase; the §61.4 `plainToHtml`
 * mirror). The report's `transcription` ref and the
 * `audio_attached → transcribed` gateway are written in the same
 * §27.7 session (§33.5). The ledger is excluded from the DTO
 * (D21/§23.7).
 */
import Audio from '../models/audio.model.js';
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import { CustomError } from '../utils/errors.js';
import { withTransaction } from '../utils/transaction.js';
import { plainToHtml } from '../utils/sanitizer.js';
import { prepareAndSplit, cleanupChunks, WavSplitError } from '../utils/wavSplitter.js';
import { transcribeChunk } from './addis-provider.js';
import { LANGUAGE_CODES, REPORT_STATUSES } from '../utils/constants.js';

/** The §31.4-generated freeze copy (BR-12: re-transcription is frozen at `generated`). */
const GENERATED_FROZEN = 'The report is already generated — audio and transcription are frozen';

/**
 * The §33.3/§33.5 merge rule (D8/D17/D18 — exported for the unit
 * gate): single-space join in ascending order; a re-transcription
 * joins `[current raw, ...newTexts]`; empty segments contribute
 * nothing; an all-empty result is `''` (a valid §33.7 result, not
 * an error).
 * @param {string|null|undefined} currentRaw - The existing row's raw (null on first transcription).
 * @param {string[]} newTexts - The newly heard audio texts (ascending order).
 * @returns {string} The merged raw.
 */
export function mergeRawTexts(currentRaw, newTexts) {
  const parts = [];
  if (currentRaw) parts.push(currentRaw);
  parts.push(...newTexts);
  return parts
    .map((t) => (typeof t === 'string' ? t.trim() : t))
    .filter((t) => t && t.length > 0)
    .join(' ');
}

/**
 * Maps a chunk/split failure to the §33.7 per-audio reason string
 * (stable, short — surfaced in the progress body and logged).
 * @param {unknown} err - The raised error.
 * @returns {string}
 */
function reasonOf(err) {
  if (err instanceof WavSplitError) {
    return err.code === 'WAV_READ_FAILED' ? 'audio could not be read' : 'audio could not be prepared';
  }
  const kind = err?.providerFailure?.kind;
  if (kind === 'rate_limited') return 'rate limited';
  if (kind === 'insufficient_credits') return 'insufficient credits';
  const raw = err?.raw;
  if (raw?.code === 'ECONNABORTED' || raw?.code === 'ETIMEDOUT') return 'provider timeout';
  if (kind === 'permanent') return 'provider rejected the request';
  return 'network error';
}

/**
 * Transcribes one audio file: split → chunk-by-chunk addis STT →
 * single-space join. Chunks are always cleaned up. The stt request
 * id and the voice-model echo come from the **first** successful
 * chunk (§23.2 null-if-unknown; §16.4: the echo is absent → null).
 * @param {object} audio - The Audio document.
 * @param {string} language - The transcription language (`am` today).
 * @returns {Promise<{ text: string, requestId: string|null, model: string|null }>}
 */
async function transcribeAudio(audio, language) {
  const chunks = await prepareAndSplit(audio.filePath);
  const texts = [];
  let requestId = null;
  let model = null;
  try {
    for (const chunk of chunks) {
      const result = await transcribeChunk(chunk, language);
      if (result.text) texts.push(result.text);
      if (requestId === null && result.requestId) requestId = result.requestId;
      if (model === null && result.model) model = result.model;
    }
  } finally {
    cleanupChunks(chunks);
  }
  return { text: texts.join(' '), requestId, model };
}

/**
 * The §33 pipeline entry — used by the PUT endpoint (§33.8).
 * @param {{ reportId: string, userId: string }} params
 * @returns {Promise<{ transcription: object|null, completed: number, failed: Array<{ audioId: string, reason: string }> }>}
 *   A full success returns the persisted row (fresh DTO surface —
 *   the ledger stripped by the model transform) with `completed`
 *   counting the heard audios and `failed` empty; a partial failure
 *   returns `{ transcription: null, completed, failed }` (nothing
 *   persisted, no status change — §33.7).
 * @throws {CustomError} 404 (report not found for this user, BR-13),
 *   403 (archived or `generated` — BR-12/§31.4), 422 (no audios /
 *   all already transcribed — D20).
 */
export async function transcribeReport({ reportId, userId }) {
  const report = await Report.findOne({ _id: reportId, user: userId });
  if (!report) {
    throw new CustomError('NOT_FOUND', 'Report not found');
  }
  if (report.isArchived) {
    throw new CustomError('FORBIDDEN', 'This report is archived');
  }
  if (report.status === REPORT_STATUSES[3]) {
    throw new CustomError('FORBIDDEN', GENERATED_FROZEN);
  }

  const audios = await Audio.find({ user: userId, report: reportId }).sort({ createdAt: 1, _id: 1 });
  if (audios.length === 0) {
    throw new CustomError('UNPROCESSABLE_ENTITY', 'Record at least one clip first');
  }

  const existing = await Transcription.findOne({ user: userId, report: reportId });
  const ledger = new Set((existing?.stt?.audios ?? []).map((id) => id.toString()));
  const pending = audios.filter((audio) => !ledger.has(audio._id.toString()));
  if (pending.length === 0) {
    throw new CustomError('UNPROCESSABLE_ENTITY', 'All clips are already transcribed');
  }

  const language = existing?.language ?? LANGUAGE_CODES.am;
  const heard = [];
  const failed = [];

  for (const audio of pending) {
    try {
      const { text, requestId, model } = await transcribeAudio(audio, language);
      heard.push({ audioId: audio._id, text, requestId, model });
    } catch (err) {
      failed.push({ audioId: audio._id, reason: reasonOf(err) });
    }
  }

  if (failed.length > 0) {
    return { transcription: null, completed: heard.length, failed };
  }

  // D8/D17/D18 merge — every pending audio succeeded: persist.
  const newTexts = heard.map((h) => h.text).filter((t) => t.length > 0);
  const raw = mergeRawTexts(existing?.raw, newTexts);
  const requestId = heard.find((h) => h.requestId !== null)?.requestId ?? null;
  const model = heard.find((h) => h.model !== null)?.model ?? null;
  const newAudioIds = heard.map((h) => h.audioId);

  const transcription = await withTransaction(async (session) => {
    let row;
    if (existing) {
      row = await Transcription.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            raw,
            latest: plainToHtml(raw),
            language,
            'stt.requestId': requestId,
            'stt.model': model,
            'stt.audios': [...ledger, ...newAudioIds.map((id) => id.toString())],
          },
        },
        { new: true, runValidators: true, session },
      );
    } else {
      row = await Transcription.create(
        [
          {
            user: userId,
            report: reportId,
            raw,
            latest: plainToHtml(raw),
            language,
            stt: { requestId, model, audios: newAudioIds },
          },
        ],
        { session },
      );
      row = row[0];
    }

    if (report.status === REPORT_STATUSES[1]) {
      await Report.updateOne(
        { _id: report._id, user: userId },
        { $set: { status: REPORT_STATUSES[2], transcription: row._id } },
        { session },
      );
    } else if (!existing) {
      await Report.updateOne(
        { _id: report._id, user: userId },
        { $set: { transcription: row._id } },
        { session },
      );
    }

    return row;
  });

  return { transcription, completed: heard.length, failed: [] };
}

/**
 * Transcribes one ephemeral clip — the §33.8/§31.6 STT-only
 * correction-dialog endpoint (`POST …/corrections/transcripts`):
 * the same chunk path as the pipeline, **nothing persisted** (the
 * clip is ephemeral — never an Audio row, §35.6/§32 DTO gate) and
 * every temp chunk unlinked.
 * @param {{ filePath: string, language?: string }} clip - The uploaded clip.
 * @returns {Promise<{ text: string }>} The transcribed instruction text.
 * @throws {CustomError} 422 when the clip cannot be read.
 */
export async function transcribeEphemeralClip({ filePath, language }) {
  try {
    const { text } = await transcribeAudio({ filePath }, language ?? LANGUAGE_CODES.am);
    return { text };
  } catch (err) {
    if (err instanceof WavSplitError) {
      throw new CustomError('UNPROCESSABLE_ENTITY', 'The voice instruction could not be read — please try again');
    }
    throw new CustomError('BAD_GATEWAY', 'Transcription failed — please retry');
  }
}