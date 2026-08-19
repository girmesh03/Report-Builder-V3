/**
 * @module utils/sanitizeHtml
 *
 * The single sanitizer configuration (§61.3/§61.4 — the ADR-038
 * editor scope: bold, italic, font size, text color; nothing else —
 * no script, no style tags, no event handlers, no embedded media).
 * Every HTML string that enters or leaves the system passes BOTH
 * gates: sanitize-on-write (server, §61.3-1 — the mock mirrors the
 * allowlist here) and sanitize-on-render (client — every render of
 * stored HTML re-sanitizes with this same configuration before it
 * touches the DOM). Double sanitization is not an error — it is the
 * policy. `dangerouslySetInnerHTML` is used only on already-sanitized
 * input.
 */
import DOMPurify from "dompurify";

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "span"],
  ALLOWED_ATTR: ["style"],
  ALLOWED_STYLE_PROPERTIES: ["font-size", "color"],
};

/**
 * Sanitize rich-text HTML with the §61.4 configuration.
 * @param {string} html
 * @returns {string}
 */
export const sanitizeHtml = (html) => DOMPurify.sanitize(html ?? "", SANITIZE_OPTIONS);

/**
 * Plain text → safe HTML: every render path that joins plain `raw`
 * texts (the transcription step's merged story, pre-correction)
 * escapes through here — the paragraph wrapper matches the editor's
 * output shape so the story renders identically before and after a
 * Mode-1 save.
 * @param {string} text
 * @returns {string}
 */
export const plainToHtml = (text) => {
  const escaped = String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped ? `<p>${escaped}</p>` : "";
};