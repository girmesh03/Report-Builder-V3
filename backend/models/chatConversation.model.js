/**
 * @module models/chat-conversation
 *
 * ChatConversation model (§24) — the persistent AI chat history of a
 * report (F7, §12.8, §36, §55). Exactly **one** conversation per
 * report (§17.2, §17.3 — Report—ChatConversation 1—1): a single
 * document whose messages are embedded child documents (not a
 * separate collection). User-scoped (BR-13, §3.2.3). Each message
 * carries the `{ provider, model, reasoning }` triple (ADR-014,
 * §16.2, §18.7). **No `status`/`isArchived`/`archivedAt`/
 * `deletedAt`**; **no `reasoning_content`** — provider reasoning
 * output is never persisted (§16.4); no token/usage fields (§16.1
 * assigns that decision to §36).
 *
 * Conventions (§18): `timestamps: true`, `_id` the only key, enum
 * values from the frozen §11 constants, indexes declared via
 * `schema.index(..)`, transforms strip `id` and `__v` (§24.7), no
 * business-logic hooks (§18.6, §24.6).
 */
import mongoose from 'mongoose';
import {
  AI_PROVIDERS,
  AI_REASONING_DEFAULT,
  AI_REASONING_EFFORTS,
  MESSAGE_ROLES,
} from '../utils/constants.js';

const { Schema, model } = mongoose;

/**
 * The embedded message document (§24.2) — `_id: false`: the exposed
 * message surface is exactly `role`, `content`, `provider`, `model`,
 * `reasoning`, `createdAt` (§24.7). `model` is a plain String —
 * registry membership is validated by §36/§29 (a non-member is
 * rejected 422, never stored; the `AI_MODELS` registry is per-provider
 * and not a flat enum). Chronological order is guaranteed by the
 * per-message `createdAt`, never by array index (§18.7).
 */
const messageSchema = new Schema(
  {
    role: {
      type: String,
      required: true,
      enum: MESSAGE_ROLES,
    },
    content: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
      enum: AI_PROVIDERS,
    },
    model: {
      type: String,
      required: true,
    },
    reasoning: {
      type: String,
      required: true,
      enum: AI_REASONING_EFFORTS,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false },
);

const chatConversationSchema = new Schema(
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
    reasoning: {
      type: String,
      default: AI_REASONING_DEFAULT,
      enum: AI_REASONING_EFFORTS,
      required: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
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
 * Owner scope (§24.3) — the mandatory owner-scoping index (§18.3,
 * BR-13).
 */
chatConversationSchema.index({ user: 1 });

/**
 * One-per-report edge (§24.3) — unique + sparse: the proven
 * §17.2/§17.3 one-conversation-per-report key; the same index serves
 * the per-report conversation read used by §36/§55.
 */
chatConversationSchema.index({ report: 1 }, { unique: true, sparse: true });

/**
 * Chronology (§24.3) — covers ordered message reads; the
 * chronological re-merge rule is a read convention (§18.7), not a
 * stored order field.
 */
chatConversationSchema.index({ report: 1, 'messages.createdAt': 1 });

/**
 * Transforms (§18.4, §24.7) — strip the derived `id` virtual and the
 * `__v` version key from every serialized ChatConversation; `_id`
 * stays `_id` (§12.11-3); embedded messages serialize as plain
 * objects in chronological order (exactly `role`, `content`,
 * `provider`, `model`, `reasoning`, `createdAt` — `_id: false` on
 * the message schema keeps the surface exact). Transforms never
 * mutate the stored document and never rename fields.
 */
function deleteTransform(doc, ret) {
  delete ret.id;
  delete ret.__v;
  return ret;
}

chatConversationSchema.set('toJSON', { virtuals: true, transform: deleteTransform });
chatConversationSchema.set('toObject', { virtuals: true, transform: deleteTransform });

const ChatConversation = model('ChatConversation', chatConversationSchema);

export default ChatConversation;