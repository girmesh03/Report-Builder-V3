/**
 * @module services/drive-service
 *
 * The §37 Google-boundary module — the **only** Google API
 * reference home in the backend (the §37.7 grep gate) and the owner
 * of the backend-side `±` resolution (§37.3, §64: the resolution
 * happens **at export by the backend**, in the exported artifact
 * only — stored content and the §37.5 content surface are never
 * touched, BR-17). The Google Docs export route
 * (`POST /reports/:reportId/export/docs`) is **not mounted** while
 * `EXPORT_DOCS_ENABLED` is `false` (the §11.3 constant — the route
 * falls through to the §27.5 404 handler; the §58 menu shows the
 * "coming soon" copy); when the flag flips (ADR-024 closes, the
 * §28 OAuth architecture delivers the user-scoped token per
 * §37.4) the route mounts and this module becomes live without
 * page changes. No `GOOGLE_*` env reads exist (§37.7).
 */
import { EXPORT_DOCS_ENABLED } from '../utils/constants.js';

/**
 * The §64.5 fixed-label vocabulary of the official report format —
 * the `±`-marked structural labels the renderer mints (§34.6) and
 * the resolution map of §64.6 (each token resolves to its official
 * text — the unmarked label).
 * @type {readonly string[]}
 */
const OFFICIAL_LABELS = Object.freeze([
  'ቀን',
  'ብራንች',
  'ስም',
  'ስራ የገባሁበት ሰዓት',
  'የተሰሩ ስራዎች',
  'መፍትሄ የሚፈሉ ጉዳዮች',
  'አጠቃላይ አስተያየት',
  'ከስራ የወጣሁበት ሰዓት',
]);

/** Static vocabulary regex — built from the fixed label list, never from user input. */
const TOKEN_RE = new RegExp(`±(${OFFICIAL_LABELS.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

/**
 * The §64.6 export-time resolution — replaces each `±`-marked
 * official label with its official text **in the exported artifact
 * only** (BR-17: language unchanged, format-only resolution; stored
 * content and the §37.5 surface never pass through here).
 * @param {string} html - The report content HTML.
 * @returns {string} The resolved artifact text.
 */
export function resolveOfficialTokens(html) {
  return String(html ?? '').replace(TOKEN_RE, '$1');
}

/**
 * The §37.3 Google Docs export interface — **unreachable while
 * `EXPORT_DOCS_ENABLED` is false** (the route is unmounted). When
 * the flag flips, the flow becomes: resolve the `±` tokens in the
 * report's `latest` (sanitized §61) → create the Google Docs
 * document in the user's own Drive via `drive.file` scope with the
 * §37.4 token → return `{ documentId, url }`. The Google API call
 * itself is ADR-024-deferred — this module is the boundary.
 * @param {string} content - The report's `latest` HTML.
 * @returns {{ documentId: string, url: string }} The flag-on contract shape.
 * @throws {Error} Always — the flag is false (defensive; the route unmount makes this unreachable).
 */
export function exportToDocs(content) {
  if (!EXPORT_DOCS_ENABLED) {
    throw new Error('Google Docs export is not enabled');
  }
  const resolved = resolveOfficialTokens(content);
  // The ADR-024-deferred Google API call lands here: `resolved` is
  // the artifact; documentId/url come from the Drive response.
  return { documentId: '', url: '' };
}