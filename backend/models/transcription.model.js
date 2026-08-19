/**
 * @module models/transcription
 *
 * Transcription model (§23) — the STT output document of a report,
 * in a **1:1 relationship with the Report** (Report—Transcription
 * 1:1, §17.3): one transcription per report, carrying the merged STT
 * result of all the report's clips (§33). User-scoped (BR-13,
 * §3.2.3). The single content-bearing model: the report carries no
 * content fields (§21.2) — `raw`/`latest` implement the shared
 * content shape (§18.7, BR-11, F5) with a dual-phase `latest`
 * (§23.2). **No `status`** — presence is expressed through
 * `REPORT_STATUSES` (§17.6); **no version/history fields** (ADR-005
 * retired).
 *
 * Conventions (§18): `timestamps: true`, `_id` the only key, enum
 * values from the frozen §11 constants, indexes declared via
 * `schema.index(..)`, transforms strip `id` and `__v` (§23.7), no
 * business-logic hooks (§18.6, §23.6).
 */
import mongoose from 'mongoose';
import { LANGUAGE_CODES } from '../utils/constants.js';

const { Schema, model } = mongoose;

/**
 * STT audit metadata (§23.2) — the Addis AI request correlation id
 * (persisted per the §16.4 permission, ADR-019) and the voice model
 * actually used (a free provider-native string — the `AI_MODELS`
 * registry is the text-generation registry only). Both null when
 * unknown; embedded child document, `_id: false`.
 */
const sttSchema = new Schema(
  {
    requestId: {
      type: String,
      default: null,
    },
    model: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const transcriptionSchema = new Schema(
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
    raw: {
      type: String,
      required: true,
    },
    latest: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: LANGUAGE_CODES.am,
      enum: LANGUAGE_CODES,
      required: true,
    },
    stt: {
      type: sttSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Owner scope (§23.3) — the mandatory owner-scoping index (§18.3,
 * BR-13).
 */
transcriptionSchema.index({ user: 1 });

/**
 * 1:1 edge (§23.3) — unique + sparse: one transcription per report
 * (§17.3, ADR-030, §21.3). Serves the report's `transcription` ref
 * resolution.
 */
transcriptionSchema.index({ report: 1 }, { unique: true, sparse: true });

/**
 * Transforms (§18.4, §23.7) — strip the derived `id` virtual and the
 * `__v` version key from every serialized Transcription; `_id` stays
 * `_id` (§12.11-3). Exposed surface: `_id`, `report`, `language`,
 * `raw`, `latest`, `stt.requestId`, `stt.model`, timestamps.
 * Transforms never mutate the stored document and never rename
 * fields.
 */
function deleteTransform(doc, ret) {
  delete ret.id;
  delete ret.__v;
  return ret;
}

transcriptionSchema.set('toJSON', { virtuals: true, transform: deleteTransform });
transcriptionSchema.set('toObject', { virtuals: true, transform: deleteTransform });

const Transcription = model('Transcription', transcriptionSchema);

export default Transcription;