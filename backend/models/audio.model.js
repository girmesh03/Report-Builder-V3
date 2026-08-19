/**
 * @module models/audio
 *
 * Audio model (§22) — the metadata-only document representing one
 * recorded audio clip (the binary itself lives on the backend local
 * filesystem, §12.9). User-scoped (BR-13, §3.2.3); the child-side
 * join key holder of the Report—Audio edge (§17.3): carries `report`,
 * written once at upload. **No `status`** — audio presence is
 * expressed exclusively through the report machine (§17.6); **no
 * `isArchived`/`archivedAt`/`deletedAt`** — only Report and Branch
 * are archivable (§20.4, §21.6); **no TTL** — retention is inherited
 * from the owning report (§22.3).
 *
 * Conventions (§18): `timestamps: true`, `_id` the only key, enum
 * values from the frozen §11 constants, indexes declared via
 * `schema.index(..)`, transforms strip `id`, `__v`, and `filePath`
 * (§22.7), no business-logic hooks (§18.6, §22.6).
 */
import mongoose from 'mongoose';
import { AUDIO_ALLOWED_MIME_TYPES } from '../utils/constants.js';

const { Schema, model } = mongoose;

const audioSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    report: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: AUDIO_ALLOWED_MIME_TYPES,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    durationSec: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Owner scope (§22.3) — the mandatory owner-scoping index (§18.3,
 * BR-13); every clip query resolves the owning user first.
 */
audioSchema.index({ user: 1 });

/**
 * Report source query (§22.3) — serves the §17.3 report-source
 * resolution (`Audio.where({ report })`) and the clip group reads of
 * the review UI (§54); declared via `schema.index(..)`, no field-
 * level `unique: true` (a report legitimately holds several clips).
 */
audioSchema.index({ user: 1, report: 1 });

/**
 * Transforms (§18.4, §22.7) — strip the derived `id` virtual, the
 * `__v` version key, and the server-internal `filePath` from every
 * serialized Audio; `_id` stays `_id` (§12.11-3). The DTO exposes
 * the metadata surface only (`_id`, `report`, `mimeType`, `sizeBytes`,
 * `durationSec`, timestamps). Transforms never mutate the stored
 * document and never rename fields.
 */
function deleteTransform(doc, ret) {
  delete ret.id;
  delete ret.__v;
  delete ret.filePath;
  return ret;
}

audioSchema.set('toJSON', { virtuals: true, transform: deleteTransform });
audioSchema.set('toObject', { virtuals: true, transform: deleteTransform });

const Audio = model('Audio', audioSchema);

export default Audio;