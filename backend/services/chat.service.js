/**
 * @module services/chat-service
 *
 * The §36 conversation surface behind the correction chat UI (F7):
 * the lazy conversation row (§36.2 — one per report, unique `report`
 * ref, created at its first saved turn, never preemptive), the
 * message-append contract with the `(provider, model, reasoning)`
 * triple per message (ADR-014), the §36.5 history projection, and
 * the service-appended assistant answer. All writes run in the
 * §27.7 session; the row-creation race is the unique-index 11000
 * → raw 409 (the client re-reads and retries, §36.6).
 *
 * **Assistant answer (derived, §36.3):** the endpoint never calls a
 * provider itself — the service runs the §35/§16.6 provider chain
 * for the reply: the conversation projection + the report's
 * `latest` as context, plain prose (no JSON — a conversational
 * answer, per the §36.7 example), `AI_CORRECTION_TEMPERATURE` /
 * `AI_CORRECTION_MAX_OUTPUT_TOKENS`, and the conversation's
 * standing reasoning; the answer is appended as a second message in
 * the same session (the 201 returns both turns, §36.7). `reasoning`
 * on the append is optional: absent → the conversation's standing
 * default (`AI_REASONING_DEFAULT`), present → validated (the §29
 * chain) and persisted as the new default — a selection is a
 * selection (§36.4). Every message — user and assistant — records
 * the effort actually used, never `null` (§24.2). System notes
 * (generation turns, §34.5/§34.8) are excluded from the projection
 * (§36.5). No update/delete endpoint exists (§36.3); the
 * conversation's lifetime is the owning report's (§62 cascade).
 */
import ChatConversation from '../models/chatConversation.model.js';
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import { CustomError } from '../utils/errors.js';
import { withTransaction } from '../utils/transaction.js';
import {
  AI_CONVERSATION_HISTORY_MAX_ENTRIES,
  AI_CORRECTION_MAX_OUTPUT_TOKENS,
  AI_CORRECTION_TEMPERATURE,
  AI_REASONING_DEFAULT,
  MESSAGE_ROLES,
} from '../utils/constants.js';
import { runText, ProviderChainExhausted } from './provider-chain.js';

/** The chat-assistant context block (§36 — the correction interface; §8 honesty rules). */
function buildAssistantSystem() {
  return [
    'You are the supervisor\'s report assistant.',
    'Answer in Amharic, concisely and factually, based only on the report content provided.',
    'Never invent facts, people, or events that are not present in the report content.',
    'If the answer is not in the content, say so plainly.',
  ].join('\n');
}

/**
 * The §36.5 history projection — entries with `role` `user`/
 * `assistant` only (system notes excluded from prompts), ordered by
 * `messages.createdAt` (index §24), bounded to the recent
 * `AI_CONVERSATION_HISTORY_MAX_ENTRIES`.
 * @param {{ reportId: string, userId: string }} params
 * @returns {Promise<Array<{ role: string, content: string, createdAt: Date }>>}
 */
export async function getConversationProjection({ reportId, userId }) {
  const conversation = await ChatConversation.findOne({ user: userId, report: reportId })
    .sort({ 'messages.createdAt': 1 })
    .lean();
  if (!conversation) return [];
  return (conversation.messages ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-AI_CONVERSATION_HISTORY_MAX_ENTRIES)
    .map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }));
}

/**
 * Appends a `system` audit note to the conversation (generation
 * turn record, §34.5; validation-rejection note, §34.8) — the lazy
 * row is created here when none exists (the only other creator is
 * the appendMessage path, §36.2). System notes are excluded from
 * prompts (§36.5). Runs inside the caller's session.
 * @param {{ reportId: string, userId: string, content: string, triple: { provider: string, model: string, reasoning: string|null }, session: object }} params
 */
export async function appendSystemNote({ reportId, userId, content, triple, session }) {
  let conversation = await ChatConversation.findOne({ user: userId, report: reportId }).session(session);
  if (!conversation) {
    conversation = await ChatConversation.create(
      [{ user: userId, report: reportId, reasoning: AI_REASONING_DEFAULT, messages: [] }],
      { session },
    );
    conversation = conversation[0];
  }
  conversation.messages.push({
    role: MESSAGE_ROLES[0],
    content,
    provider: triple.provider,
    model: triple.model,
    reasoning: triple.reasoning ?? conversation.reasoning,
  });
  await conversation.save({ session });
}

/**
 * Resolves the model selection for a provider from the
 * conversation's last stored message for that provider (§16.6: the
 * user's selection rides the fallback), else undefined (the chain
 * falls back to the provider's registry default).
 * @param {{ reportId: string, userId: string, provider: string }} params
 * @returns {Promise<object|undefined>} `{ [provider]: model }` or undefined.
 */
export async function getLastModelForProvider({ reportId, userId, provider }) {
  const conversation = await ChatConversation.findOne({ user: userId, report: reportId }).lean();
  if (!conversation?.messages?.length) return undefined;
  const last = [...conversation.messages]
    .reverse()
    .find((m) => m.provider === provider && m.model);
  return last ? { [provider]: last.model } : undefined;
}

/**
 * Resolves the standing reasoning for an append (§36.4): a provided
 * effort is validated by the §29 chain and persisted as the new
 * conversation default; absent → the current default.
 * @param {object} conversation - The conversation row (or null).
 * @param {string|undefined} reasoning - The optional provided effort.
 * @returns {{ default: string, used: string }}
 */
function resolveReasoning(conversation, reasoning) {
  const standing = conversation?.reasoning ?? AI_REASONING_DEFAULT;
  return reasoning === undefined ? { default: standing, used: standing } : { default: reasoning, used: reasoning };
}

/**
 * GET /reports/:reportId/chat — the conversation DTO; a report with
 * no conversation yet responds with `{ messages: [] }` (200, never
 * 404 — §36.2).
 * @param {{ reportId: string, userId: string }} params
 * @returns {Promise<{ messages: object[], _id?: string, user?: string, report?: string }>}
 */
export async function getConversation({ reportId, userId }) {
  const report = await Report.findOne({ _id: reportId, user: userId });
  if (!report) throw new CustomError('NOT_FOUND', 'Report not found');
  const conversation = await ChatConversation.findOne({ user: userId, report: reportId });
  if (!conversation) return { messages: [] };
  return conversation;
}

/**
 * POST /reports/:reportId/chat/messages — appends the user turn
 * (triple recorded), then the service-appended assistant answer in
 * the same session; the 201 returns the fresh conversation DTO
 * (both turns, §36.7).
 * @param {{ reportId: string, userId: string, content: string, provider: string, model: string, reasoning?: string }} params
 * @returns {Promise<object>} The fresh conversation document.
 * @throws {CustomError} 404 / 403 (archived — content-changing,
 *   §31.4 guard principle) / ProviderChainExhausted → the controller
 *   maps 502; the lazy-row creation race surfaces as the raw 11000
 *   409 (never remapped — §36.6).
 */
export async function appendMessage({ reportId, userId, content, provider, model, reasoning }) {
  const report = await Report.findOne({ _id: reportId, user: userId });
  if (!report) throw new CustomError('NOT_FOUND', 'Report not found');
  if (report.isArchived) throw new CustomError('FORBIDDEN', 'This report is archived');

  const conversation = await ChatConversation.findOne({ user: userId, report: reportId });
  const reasoningPlan = resolveReasoning(conversation, reasoning);

  const projection = conversation
    ? (conversation.messages ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-AI_CONVERSATION_HISTORY_MAX_ENTRIES)
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  const answer = await runChatAnswer({
    reportId,
    userId,
    projection,
    content,
    reasoning: reasoningPlan.used,
  });

  const fresh = await withTransaction(async (session) => {
    let row = conversation
      ? await ChatConversation.findById(conversation._id).session(session)
      : null;
    if (!row) {
      const created = await ChatConversation.create(
        [{ user: userId, report: reportId, reasoning: reasoningPlan.default, messages: [] }],
        { session },
      );
      row = created[0];
    }
    if (reasoningPlan.default !== row.reasoning) {
      row.reasoning = reasoningPlan.default;
    }
    row.messages.push({
      role: MESSAGE_ROLES[1],
      content,
      provider,
      model,
      reasoning: reasoningPlan.used,
    });
    row.messages.push({
      role: MESSAGE_ROLES[2],
      content: answer.text,
      provider: answer.provider,
      model: answer.model,
      reasoning: reasoningPlan.used,
    });
    await row.save({ session });
    return row;
  });

  return fresh;
}

/**
 * Runs the assistant TTT call (the §36.3 "generated by the §35
 * correction engine" — the provider chain, prose output).
 * @param {object} params
 * @returns {Promise<{ text: string, provider: string, model: string, reasoning: string|null }>}
 */
async function runChatAnswer({ reportId, userId, projection, content, reasoning }) {
  const transcription = await Transcription.findOne({ user: userId, report: reportId }).lean();
  const context = transcription?.latest ?? '';

  const messages = [
    ...projection,
    { role: MESSAGE_ROLES[1], content },
  ];
  const system = `${buildAssistantSystem()}\n\nReport content:\n${context}`;

  try {
    const result = await runText({
      kind: 'chat',
      system,
      messages,
      schema: null,
      reasoning,
      temperature: AI_CORRECTION_TEMPERATURE,
      maxTokens: AI_CORRECTION_MAX_OUTPUT_TOKENS,
    });
    return { text: result.text, provider: result.provider, model: result.model, reasoning: result.reasoning };
  } catch (err) {
    if (err instanceof ProviderChainExhausted) {
      throw new CustomError('BAD_GATEWAY', err.topUpMessage ?? 'Correction failed — please try again');
    }
    throw err;
  }
}