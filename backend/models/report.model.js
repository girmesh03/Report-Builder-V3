/**
 * @module models/report
 *
 * Report model (§21) — the daily supervision report of the single
 * actor (§3), the core deliverable. User-scoped (BR-13, §3.2.3);
 * four-status machine (`REPORT_STATUSES`, §11.4, BR-06); one branch;
 * captures stored at capture time (§6.1); the 1:1 `transcription`
 * ref is the only content edge on the row — the report carries no
 * content fields (§21.2, §18.7).
 *
 * Conventions (§18): `timestamps: true`, `_id` the only key, enum
 * values from the frozen §11 constants, indexes declared via
 * `schema.index(..)` including the single spec TTL declaration
 * (§18.3, §21.3), transforms strip `id` and `__v` (§21.9), no
 * business-logic hooks (§18.6, §21.8).
 */
import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { ARCHIVED_TTL_SECONDS, REPORT_STATUSES } from '../utils/constants.js';

const { Schema, model } = mongoose;

/**
 * The capture-visit block (§21.2, §21.7) — an embedded row addressed
 * positionally by array index (no `visitNo` key, §9.3), stored in
 * capture order, `_id: false`. Each entry is a full visit with its
 * own required `HH:mm` clock pair (closed OQ-002, §21.7). The
 * `visits[0].branch === branch` lock and the ≥ 1 minimum are the
 * §29/§31 domain rules — the schema is shape-only (§18.8).
 */
const visitSchema = new Schema(
  {
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    clockIn: {
      type: String,
      required: true,
    },
    clockOut: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const reportSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: null,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    clockIn: {
      type: String,
      required: true,
    },
    clockOut: {
      type: String,
      required: true,
    },
    visits: {
      type: [visitSchema],
      required: true,
    },
    status: {
      type: String,
      default: REPORT_STATUSES[0],
      enum: REPORT_STATUSES,
      required: true,
    },
    transcription: {
      type: Schema.Types.ObjectId,
      ref: 'Transcription',
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
      required: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Owner-scoped list index (§21.3) — Reports UI reads: active rows by
 * default, archived rows on explicit filter, most recent working day
 * first, `createdAt` tiebreak for reports without a `date` yet.
 */
reportSchema.index({ user: 1, isArchived: 1, date: -1, createdAt: -1 });

/**
 * Branch-filter index (§21.3) — reports-of-a-branch lists via the
 * live `branch` reference.
 */
reportSchema.index({ user: 1, branch: 1 });

/**
 * Visits-filter index, multikey (§21.3) — a report matches when any
 * visit's `branch` equals the filter branch.
 */
reportSchema.index({ user: 1, 'visits.branch': 1 });

/**
 * Date-range and status indexes (§21.3) — §38.5/§49 rollup windows,
 * §50 range/status filters, §56 rolls.
 */
reportSchema.index({ user: 1, date: 1 });
reportSchema.index({ user: 1, status: 1 });

/**
 * Transcription 1:1 index (§21.3) — unique + sparse, the
 * one-transcription-per-report invariant (§17.3, §23).
 */
reportSchema.index({ transcription: 1 }, { unique: true, sparse: true });

/**
 * TTL declaration (§18.3, §21.3) — the single TTL index in the spec:
 * the MongoDB-internal safety net for the report retention window
 * (`ARCHIVED_TTL_SECONDS`, §11.3). The sweeper wins races; TTL runs
 * server-side without cascade or session (§12.2, §62). No other TTL
 * index exists on the model or anywhere else.
 */
reportSchema.index({ archivedAt: 1 }, { expireAfterSeconds: ARCHIVED_TTL_SECONDS });

/**
 * Transforms (§18.4, §21.9) — strip the derived `id` virtual and the
 * `__v` version key from every serialized Report; `_id` stays `_id`
 * (§12.11-3). Transforms never mutate the stored document, never
 * rename fields, and never recompute derived values.
 */
function deleteTransform(doc, ret) {
  delete ret.id;
  delete ret.__v;
  return ret;
}

reportSchema.set('toJSON', { virtuals: true, transform: deleteTransform });
reportSchema.set('toObject', { virtuals: true, transform: deleteTransform });

/**
 * Pagination plugin (§27, D1) — the reports list endpoint paginates
 * at page 1 / limit 10 / max 100 (`PAGINATION_*`, §11.3).
 */
reportSchema.plugin(mongoosePaginateV2);

const Report = model('Report', reportSchema);

export default Report;