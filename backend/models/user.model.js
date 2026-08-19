/**
 * @module models/user
 *
 * User model (§19) — the single actor of the product (Area Supervisor,
 * §3; no roles, ADR-036). Ownership root of the §17.2 system of
 * record: every other collection carries a required `user` ref
 * pointing at this document's `_id` (§18.7); the User row itself
 * carries no self-referential `user` field.
 *
 * Conventions (§18): `timestamps: true`, `_id` the only key,
 * strict mode, enum values from the frozen §11 constants, unique
 * declared via `schema.index(..)` (§18.3), transforms strip `id` and
 * `__v` (§18.4, §19.5), hooks awaitable and business-logic-free
 * (§18.6), write statics session-aware (§18.5).
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../utils/constants.js';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    position: {
      type: String,
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
 * Unique email (§19.3) — the only uniqueness on the model; declared
 * via `schema.index(..)` per §18.3 (no field-level `unique: true`
 * combined with a separate index). Serves the §28 login and
 * registration lookups; the lowercase normalization is the §29
 * validators' job, never composed in the schema (§19.2).
 */
userSchema.index({ email: 1 }, { unique: true });

/**
 * Password hashing hook (§19.4) — runs only when the password field
 * is new or modified; an unchanged hash is never rehashed; a
 * document without a password (Google-created account, F1) never
 * enters the hashing branch. The salt rounds come from
 * `BCRYPT_SALT_ROUNDS` (§11.3) — the literal never appears here.
 */
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
});

/**
 * Password comparison (§19.4) — returns a boolean; a document with
 * no password returns `false`. Plaintext passwords are never stored,
 * compared, logged, or returned.
 *
 * @param {string} candidate - the plaintext candidate.
 * @returns {Promise<boolean>} true when the candidate matches the stored hash.
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidate, this.password);
};

/**
 * Derived-name virtual (§19.4) — a pure getter over the two required
 * name fields; never persisted, never indexed, never queried. Both
 * source fields are required, so the getter is total. The virtual
 * materializes on documents (getter) and through the `toJSON`/
 * `toObject` transform surface (§18.4) — Mongoose 9 removed the
 * built-in lean virtuals option, so DTO read paths use full
 * documents and the ADR-017 transform layer (§27.7 clarification,
 * 2026-08-19).
 */
userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Transforms (§18.4, §19.5) — strip the derived `id` virtual, the
 * `__v` version key, and the hash from every serialized User; `_id`
 * stays `_id` (§12.11-3); `fullName` serializes with virtuals.
 * `password` is `select: false` and additionally deleted here so no
 * in-memory document can ever serialize the hash. Transforms never
 * mutate the stored document and never rename fields.
 */
function deleteTransform(doc, ret) {
  delete ret.id;
  delete ret.__v;
  delete ret.password;
  return ret;
}

userSchema.set('toJSON', { virtuals: true, transform: deleteTransform });
userSchema.set('toObject', { virtuals: true, transform: deleteTransform });

const User = model('User', userSchema);

export default User;