/**
 * @module services/correction-service
 *
 * The §35 correction engine (G3, BR-09/BR-10/BR-11) behind §31.6's
 * endpoints — the **surgical partial-edit contract** (SC-3): only
 * the addressed part changes; unrelated correct sections stay
 * byte-identical. Two modes (§35.2): against a **transcribed**
 * report the engine returns the **full corrected prose** (the
 * §16.4 plain-prose carve-out — no JSON, no diff structure), and
 * against a **generated** report it returns only the changed
 * slots (`{ changed: [{ section, field, content, reason }] }` —
 * the §35.4 partial schema), merged into the candidate.
 *
 * **Candidate → save flow (BR-11, §35.5):** nothing is written on
 * correction — the service RETURNS the corrected content snapshot
 * (the ephemeral candidate, ADR-033 — no staging, no accept step);
 * the client fills the live editor and persists through the
 * §31.6 content PATCH. `raw` is never rewritten; the report's Item
 * rows are never touched (§24A); `±` tokens are never resolved,
 * stripped, or translated and a `±` block is deleted only when the
 * instruction explicitly names it (§35.3). The SC-3 diff-verify:
 * the candidate keeps every `±` token of the current `latest`, and
 * the merge replaces only the addressed block (unchanged blocks
 * stay byte-identical by construction); a merge that cannot locate
 * the addressed block retries the whole chain once, then 422 with
 * the diff reason (§35.7).
 */
import Report from '../models/report.model.js';
import Transcription from '../models/transcription.model.js';
import { CustomError } from '../utils/errors.js';
import { plainToHtml } from '../utils/sanitizer.js';
import {
  AI_CORRECTION_MAX_OUTPUT_TOKENS,
  AI_CORRECTION_TEMPERATURE,
  OFFICIAL_TOKEN_PREFIX,
  REPORT_STATUSES,
} from '../utils/constants.js';
import { runText, ProviderChainExhausted } from './provider-chain.js';
import { getConversationProjection, getLastModelForProvider } from './chat.service.js';

/** The §35.4 partial schema — report corrections of a `generated` report only. */
const CORRECTION_SCHEMA = {
  type: 'object',
  properties: {
    changed: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section: { type: 'string' },
          field: { type: 'string' },
          content: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['section', 'field', 'content', 'reason'],
      },
    },
  },
  required: ['changed'],
};

/** Validates the §35.4 partial schema output. */
function validateCorrectionPayload(parsed) {
  return (
    Array.isArray(parsed?.changed) &&
    parsed.changed.every(
      (c) =>
        c &&
        typeof c.section === 'string' &&
        typeof c.field === 'string' &&
        typeof c.content === 'string' &&
        typeof c.reason === 'string',
    )
  );
}

/** The §64.5 label map — the same vocabulary the renderer mints (merged here by label). */
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

/**
 * Normalizes the provider's `field` to a merge target (§35.4's
 * `field` is a §6.3 field — the live model keys by the Amharic
 * labels, e.g. `ብራንች`, sometimes ±-prefixed; the English schema
 * keys are accepted too). Returns one of:
 * `dateLine` `branchLine` `nameLine` `exitLine` `workTimeBlock`
 * `activitiesBlock` `issuesBlock` `opinionBlock` `daySummary`
 * `header` — or null (unknown field → the SC-3 locate failure).
 */
function mergeTarget(field) {
  const f = String(field ?? '').trim().replace(/^±/, '');
  const lineTargets = {
    'ቀን': 'dateLine', date: 'dateLine',
    'ብራንች': 'branchLine', branch: 'branchLine',
    'ስም': 'nameLine', name: 'nameLine',
    'ከስራ የወጣሁበት ሰዓት': 'exitLine', exitTime: 'exitLine',
  };
  if (lineTargets[f]) return lineTargets[f];
  const blockTargets = {
    'ስራ የገባሁበት ሰዓት': 'workTimeBlock', workTime: 'workTimeBlock',
    'የተሰሩ ስራዎች': 'activitiesBlock', activities: 'activitiesBlock',
    'መፍትሄ የሚፈሉ ጉዳዮች': 'issuesBlock', unresolvedIssues: 'issuesBlock', issues: 'issuesBlock',
    'አጠቃላይ አስተያየት': 'opinionBlock', generalOpinion: 'opinionBlock', overallAssessment: 'opinionBlock', opinion: 'opinionBlock',
  };
  if (blockTargets[f]) return blockTargets[f];
  if (f === 'daySummary') return 'daySummary';
  if (f === 'header') return 'header';
  return null;
}

/** Extracts every `±`-prefixed token occurrence from a content string. */
function tokensOf(html) {
  return new Set([...String(html).matchAll(/±[^\s<]+/g)].map((m) => m[0]));
}

function escapeText(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** One §6.5 bullet paragraph (normalizes a leading ` - `). */
function bullet(text) {
  const clean = String(text ?? '').trim().replace(/^-\s*/, '');
  return clean ? `<p> - ${escapeText(clean)}</p>` : '';
}

/**
 * The §35.5 surgical merge — replaces the addressed block of the
 * current `latest` with the changed content and keeps everything
 * else byte-identical. Returns the candidate HTML, or null when a
 * changed block cannot be located (the SC-3 retry/422 trigger).
 * @param {string} latest - The current content HTML.
 * @param {Array<{section: string, field: string, content: string, reason: string}>} changed - The provider's changed slots.
 * @returns {string|null} The candidate, or null on locate failure.
 */
export function mergeChanged(latest, changed) {
  let candidate = latest;
  for (const entry of changed) {
    const target = mergeTarget(entry.field);
    const content = String(entry.content ?? '');
    const lines = content
      .split(/\r?\n/)
      .map((line) => bullet(line))
      .filter(Boolean);

    let next = null;
    if (target === 'dateLine') next = replaceLine(candidate, LABEL.date, `<p>${LABEL.date}: ${escapeText(content.trim())}</p>`);
    else if (target === 'branchLine') next = replaceLine(candidate, LABEL.branch, `<p>${LABEL.branch}: ${escapeText(content.trim())}</p>`);
    else if (target === 'nameLine') next = replaceLine(candidate, LABEL.name, `<p>${LABEL.name}: ${escapeText(content.trim())}</p>`);
    else if (target === 'exitLine') next = replaceLine(candidate, LABEL.exit, `<p>${LABEL.exit}: ${escapeText(content.trim())}</p>`);
    else if (target === 'workTimeBlock') next = replaceBlock(candidate, LABEL.workTime, LABEL.activities, lines);
    else if (target === 'activitiesBlock') next = replaceBlock(candidate, LABEL.activities, LABEL.issues, lines);
    else if (target === 'issuesBlock') next = replaceBlock(candidate, LABEL.issues, LABEL.opinion, lines);
    else if (target === 'opinionBlock') next = replaceBlock(candidate, LABEL.opinion, LABEL.exit, lines);
    else if (target === 'daySummary') next = replaceFirstBullet(candidate, LABEL.activities, lines);
    else if (target === 'header') next = replaceHeader(candidate, content);
    else return null;

    if (next === null) return null;
    candidate = next;
  }

  // The SC-3 diff-verify: every ± token of the original survives.
  const originalTokens = tokensOf(latest);
  const candidateTokens = tokensOf(candidate);
  for (const token of originalTokens) {
    if (!candidateTokens.has(token)) return null;
  }
  return candidate;
}

/**
 * Locates a label's `<p>` segment and replaces its content lines.
 * @param {string} html - The source HTML.
 * @param {string} label - The `±`-prefixed label.
 * @param {string} nextLabel - The next label (segment terminator).
 * @param {string[]} lines - The replacement bullet paragraphs.
 * @returns {string|null} The patched HTML, or null when the label is absent.
 */
function replaceBlock(html, label, nextLabel, lines) {
  const labelIndex = html.indexOf(`<p>${label}:`);
  if (labelIndex < 0) return null;
  const afterLabel = html.indexOf('</p>', labelIndex + `<p>${label}:`.length);
  if (afterLabel < 0) return null;
  const blockStart = afterLabel + 4;

  const nextIndex = html.indexOf(`<p>${nextLabel}:`, blockStart);
  const blockEnd = nextIndex >= 0 ? nextIndex : html.lastIndexOf('</body>');

  const replacement = lines.length > 0 ? lines.join('') : '';
  return html.slice(0, blockStart) + replacement + html.slice(blockEnd);
}

/**
 * Replaces a single labeled line (the exit-time line).
 * @param {string} html - The source HTML.
 * @param {string} label - The `±`-prefixed label.
 * @param {string} line - The replacement line.
 * @returns {string|null} The patched HTML, or null when the label is absent.
 */
function replaceLine(html, label, line) {
  const labelIndex = html.indexOf(`<p>${label}:`);
  if (labelIndex < 0) return null;
  const lineEnd = html.indexOf('</p>', labelIndex);
  if (lineEnd < 0) return null;
  return html.slice(0, labelIndex) + line + html.slice(lineEnd + 4);
}

/**
 * Replaces the first bullet under a content label (the day-summary
 * slot).
 * @param {string} html - The source HTML.
 * @param {string} label - The `±`-prefixed content label.
 * @param {string[]} lines - The replacement bullets.
 * @returns {string|null} The patched HTML, or null when the block is absent.
 */
function replaceFirstBullet(html, label, lines) {
  const blockStart = html.indexOf(`<p>${label}:`);
  if (blockStart < 0) return null;
  const afterLabel = html.indexOf('</p>', blockStart + `<p>${label}:`.length);
  if (afterLabel < 0) return null;
  const contentStart = afterLabel + 4;
  const nextLabel = html.slice(contentStart).search(/<p>±/);
  const contentEnd = nextLabel >= 0 ? contentStart + nextLabel : html.lastIndexOf('</body>');

  const inner = html.slice(contentStart, contentEnd);
  const firstBulletStart = inner.indexOf('<p> - ');
  if (firstBulletStart < 0) {
    return html.slice(0, contentStart) + lines.join('') + html.slice(contentEnd);
  }
  const firstBulletEnd = inner.indexOf('</p>', firstBulletStart) + 4;
  const head = html.slice(0, contentStart + firstBulletStart);
  const tail = html.slice(contentStart + firstBulletEnd);
  return head + lines.join('') + tail;
}

/**
 * Replaces the header block (the lines up to the first content
 * label) with the corrected header text.
 * @param {string} html - The source HTML.
 * @param {string} content - The corrected header text.
 * @returns {string|null} The patched HTML, or null when no header is found.
 */
function replaceHeader(html, content) {
  const firstContent = html.search(/<p>±(የተሰሩ ስራዎች|መፍትሄ የሚፈሉ ጉዳዮች|አጠቃላይ አስተያየት|ከስራ የወጣሁበት ሰዓት):/);
  const headerEnd = firstContent >= 0 ? firstContent : html.lastIndexOf('</body>');
  const headerLines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeText(line)}</p>`);
  return html.slice(0, html.indexOf('<p>')) + headerLines.join('') + html.slice(headerEnd);
}

/** The §35.2 system block — the surgical contract verbatim (BR-09). */
function buildCorrectionSystem() {
  return [
    'You apply surgical corrections to the Amharic daily-supervision report.',
    'Only the addressed section changes; every other part of the report stays byte-identical.',
    'The `±` prefix marks official structural labels: never resolve, strip, or translate them; a `±` block is deleted only when the instruction explicitly names it.',
    'Never invent facts: missing values stay blank. Answer in Amharic.',
    'Respond with a single JSON object matching the provided schema — no prose, no code fences.',
  ].join('\n');
}

/**
 * The §35.2 engine — the Mode-2/3 path.
 * @param {{ reportId: string, userId: string, instruction: string, provider?: string }} params
 * @returns {Promise<{ content: string, provider: string, model: string, reasoning: string|null }>} The ephemeral candidate (§35.5 — never stored).
 * @throws {CustomError} 404 / 403 (archived) / 422 (no transcription, or the SC-3 diff failure after retry) / 502 (providers exhausted).
 */
export async function applyCorrection({ reportId, userId, instruction, provider }) {
  const report = await Report.findOne({ _id: reportId, user: userId });
  if (!report) throw new CustomError('NOT_FOUND', 'Report not found');
  if (report.isArchived) throw new CustomError('FORBIDDEN', 'This report is archived');

  const transcription = await Transcription.findOne({ user: userId, report: reportId });
  if (!transcription) {
    throw new CustomError('UNPROCESSABLE_ENTITY', 'Transcribe the report first');
  }

  const projection = await getConversationProjection({ reportId, userId });
  const messages = [
    ...projection.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: instruction },
  ];

  const isGenerated = report.status === REPORT_STATUSES[3];
  const result = await runChain({ isGenerated, system: buildCorrectionSystem(), messages, latest: transcription.latest, provider, userId, reportId });

  if (!isGenerated) {
    // The §16.4 plain-prose carve-out — the full corrected prose.
    return {
      content: plainToHtml(result.text),
      provider: result.provider,
      model: result.model,
      reasoning: result.reasoning,
    };
  }

  // The §35.4 partial path — merge + SC-3 diff-verify, retry once.
  let candidate = mergeChanged(transcription.latest, result.parsed.changed);
  if (candidate === null) {
    const retried = await runChain({ isGenerated, system: buildCorrectionSystem(), messages, latest: transcription.latest, provider, userId, reportId });
    candidate = mergeChanged(transcription.latest, retried.parsed.changed);
    if (candidate === null) {
      throw new CustomError('UNPROCESSABLE_ENTITY', 'The correction could not be applied — please rephrase the instruction');
    }
    return {
      content: candidate,
      provider: retried.provider,
      model: retried.model,
      reasoning: retried.reasoning,
    };
  }

  return {
    content: candidate,
    provider: result.provider,
    model: result.model,
    reasoning: result.reasoning,
  };
}

/**
 * Runs the §16.6 chain for one correction request, resolving the
 * chosen provider's model from the conversation's stored selection
 * when present (§16.6) else the provider default.
 * @param {object} params
 * @returns {Promise<{ provider: string, model: string, reasoning: string|null, text: string, parsed: object|null }>}
 */
async function runChain({ isGenerated, system, messages, latest, provider, userId, reportId }) {
  const modelChoices = await getLastModelForProvider({ reportId, userId, provider });

  const prompt = isGenerated
    ? [
        'Correct the following report according to the instruction.',
        'Return only the changed slots of the partial schema. Unchanged sections are never returned.',
        'Current report content:',
        latest,
      ].join('\n')
    : [
        'Correct the following transcription according to the instruction.',
        'Return the full corrected Amharic prose — keep everything except what the instruction addresses.',
        'Current transcription:',
        latest,
      ].join('\n');

  try {
    return await runText({
      kind: 'correction',
      system,
      messages: [...messages, { role: 'user', content: prompt }],
      schema: isGenerated ? CORRECTION_SCHEMA : null,
      reasoning: null,
      temperature: AI_CORRECTION_TEMPERATURE,
      maxTokens: AI_CORRECTION_MAX_OUTPUT_TOKENS,
      modelChoices,
      startProvider: provider,
      validate: isGenerated ? validateCorrectionPayload : undefined,
    });
  } catch (err) {
    if (err instanceof ProviderChainExhausted) {
      throw new CustomError('BAD_GATEWAY', err.topUpMessage ?? 'Correction failed — please try again');
    }
    throw err;
  }
}