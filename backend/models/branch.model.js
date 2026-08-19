/**
 * @module models/branch
 *
 * Branch model (§20) — the place the supervisor operates in (more
 * than 14 branches, §3). User-scoped (BR-13, §3.2.3): created and
 * owned by the registering user; the key of the ERD User — Branch
 * edge (§17.3). Two-path lifecycle (BR-14, BR-16): active ↔ archived
 * (prepare-to-delete), permanent removal only via the reference-
 * checked sweeper (§62) — this model declares **no TTL index** (§18.3,
 * §20.3).
 *
 * Conventions (§18): `timestamps: true`, `_id` the only key, enum
 * values from the frozen §11 constants, indexes declared via
 * `schema.index(..)`, transforms strip `id` and `__v` (§20.7), no
 * business-logic hooks (§18.6, §20.6).
 */
import mongoose from 'mongoose';
import mongoosePaginateV2 from 'mongoose-paginate-v2';

const { Schema, model } = mongoose;

const branchSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
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
 * Owner-scoped list index (§20.3) — serves the F2 read paths:
 * branches listed active-only by default (`isArchived: false`),
 * archived rows on explicit filter, ordered by `name`, always scoped
 * to the owner. No field-level `unique: true` anywhere — nothing in
 * the product proves unique branch names per owner (§18.3).
 */
branchSchema.index({ user: 1, isArchived: 1, name: 1 });

/**
 * Transforms (§18.4, §20.7) — strip the derived `id` virtual and the
 * `__v` version key from every serialized Branch; `_id` stays `_id`
 * (§12.11-3). Transforms never mutate the stored document and never
 * rename fields.
 */
function deleteTransform(doc, ret) {
  delete ret.id;
  delete ret.__v;
  return ret;
}

branchSchema.set('toJSON', { virtuals: true, transform: deleteTransform });
branchSchema.set('toObject', { virtuals: true, transform: deleteTransform });

/**
 * Pagination plugin (§27, D1) — list endpoints paginate at
 * page 1 / limit 10 / max 100 (`PAGINATION_*`, §11.3).
 */
branchSchema.plugin(mongoosePaginateV2);

const Branch = model('Branch', branchSchema);

export default Branch;