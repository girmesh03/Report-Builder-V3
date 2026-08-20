/**
 * @module validators/chat
 *
 * The §36 conversation-domain rule chains (§29.5
 * `chat.validator.js`): the message append. Every append validates
 * the message tuple — `role ∈ MESSAGE_ROLES` (the `user` role only
 * for this endpoint, §36.3), `provider ∈ AI_PROVIDERS` with
 * `model ∈ AI_MODELS[provider]` (§24.2 registry checks — non-member
 * → 422, never stored), `reasoning ∈ AI_REASONING_EFFORTS` — and
 * the `content` length against `CHAT_MESSAGE_MAX_LENGTH` (4 000,
 * §11.3 — the constant is referenced, never a literal). `reasoning`
 * is optional (§36.4: absent → the conversation's standing default;
 * present → validated + persisted as the new default). The chains
 * hold no business logic — the standing-reasoning resolution and
 * the lazy-row race semantics live in the service (§36.2/§36.4).
 */
import { body, param } from 'express-validator';
import {
  AI_MODELS,
  AI_PROVIDERS,
  AI_REASONING_EFFORTS,
  CHAT_MESSAGE_MAX_LENGTH,
} from '../utils/constants.js';

/** `:reportId` — Mongo ObjectId, else 422 (§29.4). */
const reportIdParam = param('reportId').isMongoId().withMessage('Invalid report id');

/**
 * POST /chat/messages — §36.3/§36.4: `{ content, provider, model,
 * reasoning? }`. The model registry check is per-provider (the
 * `AI_MODELS` registry is not a flat enum — §24.2).
 */
const messageChain = [
  body('content')
    .isString()
    .withMessage('Message is required')
    .trim()
    .notEmpty()
    .withMessage('Message cannot be empty')
    .isLength({ max: CHAT_MESSAGE_MAX_LENGTH })
    .withMessage('Message is too long'),
  body('provider').isIn(AI_PROVIDERS).withMessage('Choose a valid provider'),
  body('model')
    .isString()
    .withMessage('Model is required')
    .custom((value, { req }) => {
      const models = AI_MODELS[req.body?.provider] ?? [];
      if (!models.some((entry) => entry.id === value)) {
        throw new Error('Choose a valid model for the provider');
      }
      return true;
    }),
  body('reasoning')
    .optional()
    .isIn(AI_REASONING_EFFORTS)
    .withMessage('Choose a valid reasoning effort'),
];

export { reportIdParam, messageChain };