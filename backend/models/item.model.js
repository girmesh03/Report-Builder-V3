/**
 * @module models/item
 *
 * Item model (§24A) — the persisted content item of a generated
 * report: one row per activity, per issue, and per comment. User-
 * scoped (BR-13, §3.2.3); replaces the retired branch-digest
 * itemization (§6.11). Items belong to a report and therefore to the
 * report's branch — carrying the report's `branch` and `date`
 * **captured at generation** (safe denormalization: capture edits are
 * frozen at `generated`, §21.7). Per-type status and rating contract
 * (§6.10). **No `isArchived`/`archivedAt`/`deletedAt`**; no
 * `attributionBasis`/`sourceClip`/`visitNo`/`itemId` (retired with
 * §6.11).
 *
 * Conventions (§18): `timestamps: true`, `_id` the only key, enum
 * values from the frozen §11 constants, indexes declared via
 * `schema.index(..)`, transforms strip `id` and `__v` (§24A.5),
 * schema-level validators are shape-only (§18.8, §24A.3), no
 * business-logic hooks (§18.6).
 */
import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';
import { ITEM_STATUSES, ITEM_STATUSES_BY_TYPE, ITEM_TYPES } from '../utils/constants.js';

const { Schema, model } = mongoose;

const itemSchema = new Schema(
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
    branch: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ITEM_TYPES,
    },
    text: {
      type: String,
      default: null,
      required() {
        return this.type !== 'comment';
      },
    },
    status: {
      type: String,
      default: null,
      enum: ITEM_STATUSES,
      validate: {
        validator(value) {
          return (
            value === null ||
            value === undefined ||
            (ITEM_STATUSES_BY_TYPE[this.type] || []).includes(value)
          );
        },
        message: 'status is not a member of the type\'s set',
      },
    },
    rating: {
      type: Number,
      default: null,
      min: 0,
      max: 5,
      validate: {
        validator(value) {
          return value === null || value === undefined || (this.type === 'comment' && Number.isInteger(value));
        },
        message: 'rating is allowed only as an integer 0-5 on a comment',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Owner scope (§24A.3) — the mandatory owner-scoping index (§18.3,
 * BR-13).
 */
itemSchema.index({ user: 1 });

/**
 * Report join (§24A.3) — serves the report-detail DTO join
 * (§31.6/§50, `withContent`).
 */
itemSchema.index({ user: 1, report: 1 });

/**
 * Branch–date–type–status (§24A.3) — serves the §38 filtering
 * contract (`GET /analytics/items?branch&type&status&date…`) and the
 * §49/§56 rolls.
 */
itemSchema.index({ user: 1, branch: 1, date: 1, type: 1, status: 1 });

/**
 * Type–status–date (§24A.3) — serves the §49 dashboard counts (status
 * distribution per item type) and the §38 export queries.
 */
itemSchema.index({ user: 1, type: 1, status: 1, date: 1 });

/**
 * One comment per report (§24A.3) — unique partial index on `report`
 * restricted to `type: 'comment'`: at most one comment row per report
 * (§6.10); uniqueness proven by the format itself (§6.3 field 7). The
 * only uniqueness on the model.
 */
itemSchema.index(
  { report: 1 },
  { unique: true, partialFilterExpression: { type: 'comment' } },
);

/**
 * Transforms (§18.4, §24A.5) — strip the derived `id` virtual and the
 * `__v` version key from every serialized Item; `_id` stays `_id`
 * (§12.11-3). Exposed surface: `_id`, `report`, `branch`, `date`,
 * `type`, `text`, `status`, `rating`, timestamps — items are flat
 * rows, never grouped (§31.6/§50). Transforms never mutate the stored
 * document and never rename fields.
 */
function deleteTransform(doc, ret) {
  delete ret.id;
  delete ret.__v;
  return ret;
}

itemSchema.set('toJSON', { virtuals: true, transform: deleteTransform });
itemSchema.set('toObject', { virtuals: true, transform: deleteTransform });

/**
 * Pagination plugin (§27, D1) — the §38 items list endpoint
 * paginates at page 1 / limit 10 / max 100 (`PAGINATION_*`, §11.3).
 */
itemSchema.plugin(mongoosePaginateV2);

const Item = model('Item', itemSchema);

export default Item;