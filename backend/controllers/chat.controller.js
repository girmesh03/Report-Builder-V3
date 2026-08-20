/**
 * @module controllers/chat
 *
 * The §36 conversation surface: the read
 * (`GET /reports/:reportId/chat` — global tier; a report with no
 * conversation yet responds 200 `{ messages: [] }`, never 404) and
 * the append (`POST /reports/:reportId/chat/messages` — ai tier;
 * 201 with the fresh conversation DTO carrying the user turn AND
 * the service-appended assistant answer, §36.7). The endpoint never
 * calls a provider itself — the service does (§36.3). The lazy row
 * is created at its first saved turn (§36.2); the unique-index race
 * surfaces as the raw 11000 409 (never remapped — §36.6).
 */
import asyncHandler from 'express-async-handler';
import { httpStatus } from '../utils/httpStatus.js';
import { getConversation, appendMessage } from '../services/chat.service.js';

/** ADR-017: the conversation DTO is the model's serialized surface (§24.2). */
const toConversationDto = (doc) => (typeof doc.toJSON === 'function' ? doc.toJSON() : doc);

/**
 * GET /reports/:reportId/chat — §36.3: `{ _id, user, report,
 * messages }`; empty conversation → `{ messages: [] }` (200).
 */
export const getConversationHandler = asyncHandler(async (req, res, next) => {
  const conversation = await getConversation({
    reportId: req.params.reportId,
    userId: req.user._id,
  });
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Conversation',
    data: toConversationDto(conversation),
  });
});

/**
 * POST /reports/:reportId/chat/messages — §36.3/§36.4: the user turn
 * (validated by the §29 chain against the §11.4 registers) plus the
 * service-appended assistant answer; 201 conversation DTO.
 */
export const postMessage = asyncHandler(async (req, res, next) => {
  const body = req.validated.body ?? {};
  const conversation = await appendMessage({
    reportId: req.params.reportId,
    userId: req.user._id,
    content: body.content,
    provider: body.provider,
    model: body.model,
    reasoning: body.reasoning,
  });
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Message sent',
    data: toConversationDto(conversation),
  });
});