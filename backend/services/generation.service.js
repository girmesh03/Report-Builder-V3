/**
 * @module services/generation-service
 *
 * The §34 report-generation engine (G2, F5): trigger & preconditions
 * (§34.2), prompt construction per §8 (§34.3), the structured-output
 * schema & parsing (§34.4), the fixed `addis → gemini → nvidia`
 * provider chain (§34.5/§16.6), and the atomic persistence of the
 * transcription `latest` + the **Item rows** + the
 * `transcribed → generated` gateway in one §27.7 session (§34.6).
 * The prompt is assembled from registry data — the §6.2 skeleton,
 * the §6.3 field list, the §6.4 type rules, the tone sample, the
 * BR-19 no-invention clause — never free-text literals outside this
 * file (the §34.9 grep gate; the §8 fixtures live here as the
 * service-owned format vocabulary).
 *
 * **Renderer (documented derivation, §6.2/§6.3/§6.4/§6.10/§34.4):**
 * the §6.2 canonical skeleton is composed deterministically — the
 * header fields (`ቀን`/`ብራንች`/`ስም`/`ሰዓት`) and the exit time come
 * from the **capture data** (form-only metadata, §6.10 — the model
 * never invents metadata; BR-19 blank when absent), while the
 * content lists (`የተሰሩ ስራዎች`/`መፍትሄ የሚፈሉ ጉዳዮች`/`አጠቃላይ
 * አስተያየት`) render the §34.4 keys: `daySummary` first, then all
 * `branchSections`' activities/issues/opinions, then
 * `overallAssessment` last — the samples' day-overview-first /
 * overall-last shape (§6.8); `header`/`exitTime` are validated for
 * schema conformance and rendered from capture. The structural
 * labels carry the §64.5 `±` token prefix (minted only here —
 * §64.5 "nothing else may mint tokens"; `OFFICIAL_TOKEN_PREFIX`).
 * Output HTML uses only the §61.4 allowlisted tags (p/br/strong/
 * em/span); bullets are the §6.5 ` - `-prefixed paragraphs.
 */
import Branch from '../models/branch.model.js';
import Item from '../models/item.model.js';
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import User from '../models/user.model.js';
import { CustomError } from '../utils/errors.js';
import { withTransaction } from '../utils/transaction.js';
import { sanitizeHtml } from '../utils/sanitizer.js';
import { formatEthiopianDate } from '../utils/ethiopianDate.js';
import {
  AI_MAX_OUTPUT_TOKENS,
  AI_TEMPERATURE,
  ITEM_STATUSES,
  OFFICIAL_TOKEN_PREFIX,
  REPORT_STATUSES,
} from '../utils/constants.js';
import { runText, ProviderChainExhausted } from './provider-chain.js';
import { getConversationProjection, appendSystemNote } from './chat.service.js';

/** The §64.5 ±-token labels — the official structural labels of the §6.3 field list. */
const LABEL = Object.freeze({
  date: `${OFFICIAL_TOKEN_PREFIX}ቀን`,
  branch: `${OFFICIAL_TOKEN_PREFIX}ብራንች`,
  name: `${OFFICIAL_TOKEN_PREFIX}ስም`,
  workTime: `${OFFICIAL_TOKEN_PREFIX}ስራ የገባሁበት ሰዓት`,
  activities: `${OFFICIAL_TOKEN_PREFIX}የተሰሩ ስራዎች`,
  issues: `${OFFICIAL_TOKEN_PREFIX}መፍትሄ የሚፈሉ ጉዳዮች`,
  opinion: `${OFFICIAL_TOKEN_PREFIX}አጠቃላይ አስተያየት`,
  exit: `${OFFICIAL_TOKEN_PREFIX}ከስራ የወጣሁበት ሰዓት`,
});

/** The §34.4 structured-output schema — the provider contract (verbatim keys). */
const GENERATION_SCHEMA = {
  type: 'object',
  properties: {
    report: {
      type: 'object',
      properties: {
        header: { type: 'string' },
        branchSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              branchName: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              unresolvedIssues: { type: 'array', items: { type: 'string' } },
              generalOpinion: { type: 'string' },
            },
            required: ['branchName', 'activities', 'unresolvedIssues', 'generalOpinion'],
          },
        },
        daySummary: { type: 'string' },
        exitTime: { type: 'string' },
        overallAssessment: { type: 'string' },
      },
      required: ['header', 'branchSections', 'daySummary', 'exitTime', 'overallAssessment'],
    },
    items: {
      type: 'object',
      properties: {
        activities: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
        issues: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
        comment: { type: 'object', properties: { text: { type: ['string', 'null'] }, rating: { type: ['integer', 'null'], minimum: 0, maximum: 5 } }, required: ['text', 'rating'] },
      },
      required: ['activities', 'issues', 'comment'],
    },
  },
  required: ['report', 'items'],
};

/**
 * Validates the provider payload against the §34.4 schema — a
 * schema-invalid response is a provider failure (§16.5: retried,
 * then fallback — never silently accepted, SC-1 gate).
 * @param {object} parsed - The parsed JSON.
 * @returns {boolean} True when the structure conforms.
 */
export function validateGenerationPayload(parsed) {
  const report = parsed?.report;
  const items = parsed?.items;
  if (!report || !items) return false;
  if (typeof report.header !== 'string') return false;
  if (!Array.isArray(report.branchSections) || report.branchSections.length === 0) return false;
  for (const section of report.branchSections) {
    if (!section || typeof section.branchName !== 'string') return false;
    if (!Array.isArray(section.activities) || !Array.isArray(section.unresolvedIssues)) return false;
    if (!section.activities.every((a) => typeof a === 'string')) return false;
    if (!section.unresolvedIssues.every((i) => typeof i === 'string')) return false;
    if (typeof section.generalOpinion !== 'string') return false;
  }
  if (typeof report.daySummary !== 'string') return false;
  if (typeof report.exitTime !== 'string') return false;
  if (typeof report.overallAssessment !== 'string') return false;
  if (!Array.isArray(items.activities) || !Array.isArray(items.issues)) return false;
  if (!items.activities.every((a) => a && typeof a.text === 'string')) return false;
  if (!items.issues.every((i) => i && typeof i.text === 'string')) return false;
  const comment = items.comment;
  if (!comment || (comment.text !== null && typeof comment.text !== 'string')) return false;
  if (comment.rating !== null && (!Number.isInteger(comment.rating) || comment.rating < 0 || comment.rating > 5)) return false;
  return true;
}

/** Escapes text for safe HTML embedding (the §61.4 content gate). */
function escapeText(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** One §6.5 bullet paragraph. */
function bullet(text) {
  return `<p> - ${escapeText(text)}</p>`;
}

/**
 * Composes the §6 canonical report HTML from the capture data and
 * the §34.4 payload (the documented §34.6 renderer). Only the
 * §61.4 allowlisted tags are produced; the ± labels are the §64.5
 * vocabulary.
 * @param {object} input
 * @param {object} input.report - The Report document (capture fields).
 * @param {object} input.user - The User document (`fullName`).
 * @param {object} input.parsed - The validated §34.4 payload.
 * @param {(id: string) => string|null} input.branchNameOf - Live branch-name resolver (§20 live join).
 * @returns {string} The full content HTML.
 */
export function renderReport({ report, user, parsed, branchNameOf }) {
  const visits = [...report.visits].sort((a, b) => {
    const byClock = a.clockIn.localeCompare(b.clockIn);
    return byClock !== 0 ? byClock : report.visits.indexOf(a) - report.visits.indexOf(b);
  });
  const isTypeTwo = report.visits.length >= 2;

  const distinctBranchIds = [];
  for (const visit of visits) {
    const id = visit.branch.toString();
    if (!distinctBranchIds.includes(id)) distinctBranchIds.push(id);
  }
  const branchNames = distinctBranchIds.map((id) => branchNameOf(id) ?? '').filter(Boolean);

  const dateLine = formatEthiopianDate(report.date) ?? '';
  const nameLine = user.fullName ?? '';
  const exitLine = visits.length > 0 ? visits[visits.length - 1].clockOut : report.clockOut;

  const headerLines = [
    `<p>${LABEL.date}: ${escapeText(dateLine)}</p>`,
    `<p>${LABEL.branch}: ${escapeText(branchNames.join(' / '))}</p>`,
    `<p>${LABEL.name}: ${escapeText(nameLine)}</p>`,
  ];
  if (isTypeTwo) {
    headerLines.push(`<p>${LABEL.workTime}:</p>`);
    for (const visit of visits) {
      headerLines.push(
        `<p>ከ${escapeText(visit.clockIn)} - ${escapeText(visit.clockOut)} ${escapeText(branchNameOf(visit.branch) ?? '')} ብራንች</p>`,
      );
    }
  } else {
    headerLines.push(`<p>${LABEL.workTime}: ${escapeText(report.clockIn)}</p>`);
  }

  const activities = [];
  if (parsed.report.daySummary) activities.push(parsed.report.daySummary);
  for (const section of parsed.report.branchSections) {
    activities.push(...section.activities);
  }
  const issues = [];
  for (const section of parsed.report.branchSections) {
    issues.push(...section.unresolvedIssues);
  }
  const opinions = [];
  for (const section of parsed.report.branchSections) {
    if (section.generalOpinion) opinions.push(section.generalOpinion);
  }
  if (parsed.report.overallAssessment) opinions.push(parsed.report.overallAssessment);

  const bodyLines = [];
  if (activities.length > 0) {
    bodyLines.push(`<p>${LABEL.activities}:</p>`, ...activities.map(bullet));
  }
  if (issues.length > 0) {
    bodyLines.push(`<p>${LABEL.issues}:</p>`, ...issues.map(bullet));
  }
  if (opinions.length > 0) {
    bodyLines.push(`<p>${LABEL.opinion}:</p>`, ...opinions.map(bullet));
  }
  bodyLines.push(`<p>${LABEL.exit}: ${escapeText(exitLine)}</p>`);

  return `<html><body>${[...headerLines, ...bodyLines].join('')}</body></html>`;
}

/**
 * The §34.3 system/context block — assembled from the §6.2 skeleton,
 * the §6.3 field list, the §6.4 type rules, the tone posture (§6.6/
 * §8.4), and the BR-19 no-invention clause. The §34.9 gate: the
 * prompt lives here (this file), never elsewhere.
 * @param {object} capture - The capture block for the content section.
 * @returns {string} The system prompt.
 */
function buildSystemPrompt() {
  return [
    'You are the Amharic daily-supervision report generator of a restaurant network.',
    'Write the report in Amharic (with §7 transliteration for English workplace terms) in a professional, first-person supervisor voice.',
    'The report always follows this structure:',
    '1) header (date, branch, supervisor name, work-start or per-branch time ranges);',
    '2) የተሰሩ ስራዎች (completed activities);',
    '3) መፍትሄ የሚፈሉ ጉዳዮች (issues needing solutions, including urgent problems);',
    '4) አጠቃላይ አስተያየት (general opinion and improvement opinion);',
    '5) exit time.',
    'Type-1 day: one branch, a single work-start line. Type-2 day: multiple visits — one time range per visit, branch names joined with " / " in the header, listed once even when revisited.',
    'Every content value comes from the provided transcription — never invent, guess, or fill missing values (missing stays blank/"not specified").',
    'Organize the transcription into the content lists without reordering events.',
  ].join('\n');
}

/**
 * The §34.3 content block — the capture data (Ethiopian date,
 * branch names, clocks, visits) and the reviewed transcription
 * (§23 `latest` — BR-07 source of truth), plus the verbatim §34.4
 * schema and the strict JSON-mode instruction (Addis has no
 * response-format knob — its JSON mode arrives through the prompt,
 * §16.4).
 * @param {object} input
 * @returns {string} The user content block.
 */
function buildContentBlock({ report, user, branchNameOf, latest }) {
  const date = formatEthiopianDate(report.date) ?? 'not specified';
  const visits = report.visits
    .map((v) => `${branchNameOf(v.branch) ?? '?'} ${v.clockIn}-${v.clockOut}`)
    .join('; ');
  const schemaText = [
    '{',
    '  "report": {',
    '    "header": "string",',
    '    "branchSections": [ { "branchName": "string", "activities": ["string"], "unresolvedIssues": ["string"], "generalOpinion": "string" } ],',
    '    "daySummary": "string",',
    '    "exitTime": "string",',
    '    "overallAssessment": "string"',
    '  },',
    '  "items": {',
    '    "activities": [ { "text": "string" } ],',
    '    "issues": [ { "text": "string" } ],',
    '    "comment": { "text": "string or null", "rating": "integer 0-5 or null" }',
    '  }',
    '}',
  ].join('\n');
  return [
    'Capture data:',
    `- date (Ethiopian): ${date}`,
    `- supervisor: ${user.fullName ?? ''}`,
    `- main branch: ${branchNameOf(report.branch) ?? ''}`,
    `- day clock pair: ${report.clockIn} - ${report.clockOut}`,
    `- visits: ${visits}`,
    '',
    'Reviewed transcription (the only content source):',
    latest ?? '',
    '',
    'Respond with a single JSON object matching EXACTLY this schema — no prose, no code fences; header/daySummary/exitTime/overallAssessment are single strings:',
    schemaText,
  ].join('\n');
}

/**
 * The generation trigger (§34.2/§34.6/§34.7): from `transcribed`
 * only; writes `latest` + the Item rows + the status gateway in one
 * session; regeneration from `generated` is refused (terminal,
 * BR-06/BR-08).
 * @param {{ reportId: string, userId: string }} params
 * @returns {Promise<{ report: object, transcription: object, items: object[] }>} Fresh documents for the DTO mapping (C8 single round-trip).
 * @throws {CustomError} 404 / 403 (archived, already generated, not transcribed) / 422 (content rejected by validation, §34.8) / ProviderChainExhausted → the controller maps 502.
 */
export async function generateReport({ reportId, userId }) {
  const report = await Report.findOne({ _id: reportId, user: userId });
  if (!report) throw new CustomError('NOT_FOUND', 'Report not found');
  if (report.isArchived) throw new CustomError('FORBIDDEN', 'This report is archived');

  if (report.status === REPORT_STATUSES[3]) {
    throw new CustomError('FORBIDDEN', 'This report is already generated');
  }
  if (report.status !== REPORT_STATUSES[2]) {
    throw new CustomError('FORBIDDEN', 'Transcribe the report first');
  }

  const transcription = await Transcription.findOne({ user: userId, report: reportId });
  if (!transcription || transcription.raw === null) {
    throw new CustomError('FORBIDDEN', 'Transcribe the report first');
  }

  const user = await User.findById(userId);
  const branchIds = new Set([
    report.branch.toString(),
    ...report.visits.map((v) => v.branch.toString()),
  ]);
  const branches = await Branch.find({ user: userId, _id: { $in: [...branchIds] } }).lean();
  const branchNameOf = (id) => branches.find((b) => b._id.toString() === id.toString())?.name ?? null;

  const projection = await getConversationProjection({ reportId, userId });
  const messages = [
    ...projection.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: buildContentBlock({ report, user, branchNameOf, latest: transcription.latest }) },
  ];

  let chainResult;
  try {
    chainResult = await runText({
      kind: 'generation',
      system: buildSystemPrompt(),
      messages,
      schema: GENERATION_SCHEMA,
      reasoning: null,
      temperature: AI_TEMPERATURE,
      maxTokens: AI_MAX_OUTPUT_TOKENS,
      validate: validateGenerationPayload,
    });
  } catch (err) {
    if (err instanceof ProviderChainExhausted) {
      throw new CustomError('BAD_GATEWAY', err.topUpMessage ?? 'Report generation failed — please try again');
    }
    throw err;
  }

  const latest = sanitizeHtml(renderReport({ report, user, parsed: chainResult.parsed, branchNameOf }));
  const itemDate = report.date ?? new Date();
  const itemRows = [
    ...chainResult.parsed.items.activities.map((a) => ({
      user: userId, report: report._id, branch: report.branch, date: itemDate,
      type: 'activity', text: a.text, status: ITEM_STATUSES[2],
    })),
    ...chainResult.parsed.items.issues.map((i) => ({
      user: userId, report: report._id, branch: report.branch, date: itemDate,
      type: 'issue', text: i.text, status: ITEM_STATUSES[0],
    })),
    ...(chainResult.parsed.items.comment?.text !== null || chainResult.parsed.items.comment?.rating !== null
      ? [{
          user: userId, report: report._id, branch: report.branch, date: itemDate,
          type: 'comment', text: chainResult.parsed.items.comment.text, rating: chainResult.parsed.items.comment.rating,
        }]
      : []),
  ];

  const { report: freshReport, transcription: freshTranscription, items: freshItems } = await withTransaction(async (session) => {
    await Transcription.updateOne(
      { _id: transcription._id, user: userId },
      { $set: { latest } },
      { session },
    );
    await Item.deleteMany({ user: userId, report: report._id }, { session });
    const createdItems = itemRows.length > 0
      ? await Item.insertMany(itemRows, { session })
      : [];
    const updated = await Report.findOneAndUpdate(
      { _id: report._id, user: userId, status: REPORT_STATUSES[2] },
      { $set: { status: REPORT_STATUSES[3] } },
      { new: true, session },
    );
    if (!updated) {
      throw new CustomError('CONFLICT', 'The report changed — please retry');
    }
    await appendSystemNote({
      reportId: report._id, userId,
      content: 'Report generated',
      triple: { provider: chainResult.provider, model: chainResult.model, reasoning: chainResult.reasoning },
      session,
    });
    const freshTranscriptionDoc = await Transcription.findById(transcription._id).session(session);
    return { report: updated, transcription: freshTranscriptionDoc, items: createdItems };
  });

  return { report: freshReport, transcription: freshTranscription, items: freshItems };
}