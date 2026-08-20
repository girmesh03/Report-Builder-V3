/**
 * @module utils/sanitizer
 *
 * The server-side gate of the §61.3/§61.4 rich-text policy — the
 * **hand-rolled allowlist mirror of the §46.16/§53 client
 * sanitizer** (`client/src/utils/sanitizeHtml.js`): both gates share
 * the single configuration (ADR-038 editor scope — bold, italic,
 * font size, text color; nothing else). The server is the last
 * writer of stored content (§61.3-1): every persisted content write
 * (`PATCH /reports/:reportId/content`, generation output,
 * correction output) sanitizes through here before the write, in
 * the same request path as the §29 validation. Content is preserved
 * — Amharic/Ethiopic text, the `±` prefix tokens of §64, and
 * plain-text structure pass through unchanged: the sanitizer strips
 * markup, never content characters (§61.4).
 *
 * Implementation is a small recursive DOM walk over a parsed HTML
 * tree — no runtime, no dependency (§66.8; dompurify stays
 * client-only, §61.4). Only the allowlisted tags survive (the
 * **exact** §46.16/§53 client set — `p/br/strong/em/span`; `b`/`i`
 * normalize to `strong`/`em` in DOMPurify, so they are dropped
 * here, not aliased); every attribute except the allowlisted
 * `style` properties is dropped; `script`/`style`/`iframe` and
 * every event handler are removed entirely. `plainToHtml` mirrors
 * the client's `plainToHtml` (§46.16/§53): the plain `raw` →
 * content-HTML wrapper so the merged story renders identically
 * before and after a Mode-1 save.
 */
const ALLOWED_TAGS = new Set(['p', 'br', 'strong', 'em', 'span']);
const ALLOWED_STYLE_PROPERTIES = new Set(['font-size', 'color']);
const VOID_TAGS = new Set(['br']);

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
const STYLE_ATTR_RE = /(?:^|;)\s*([a-zA-Z-]+)\s*:\s*([^;]*)/g;

function escapeText(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Filters a raw `style` attribute value down to the §61.4 property
 * set (`font-size`, `color`) — everything else (including any
 * `expression(`, `url(`, `@import` payloads) is dropped.
 * @param {string} style - The raw style attribute value.
 * @returns {string} The filtered declarations, or '' when none survive.
 */
function filterStyle(style) {
  const kept = [];
  let match;
  STYLE_ATTR_RE.lastIndex = 0;
  while ((match = STYLE_ATTR_RE.exec(String(style))) !== null) {
    const [prop, value] = [match[1].toLowerCase(), match[2].trim()];
    if (ALLOWED_STYLE_PROPERTIES.has(prop) && value && !/(expression|url\s*\(|@import|javascript)/i.test(value)) {
      kept.push(`${prop}: ${value}`);
    }
  }
  return kept.join('; ');
}

/**
 * Sanitizes rich-text HTML with the §61.4 configuration — the
 * server mirror of the client's DOMPurify options
 * (`ALLOWED_TAGS: [p, br, strong, em, span]`, `style` attr, style
 * properties `font-size`/`color`).
 * @param {string} html - The HTML to sanitize.
 * @returns {string} The sanitized HTML (markup stripped, content preserved).
 */
export function sanitizeHtml(html) {
  const input = String(html ?? '');
  const openStack = [];
  let out = '';

  let lastIndex = 0;
  let match;
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(input)) !== null) {
    const [, closing, rawTag, rawAttrs, selfClose] = match;
    const tag = rawTag.toLowerCase();

    out += escapeText(input.slice(lastIndex, match.index));
    lastIndex = TAG_RE.lastIndex;

    if (closing) {
      const idx = openStack.lastIndexOf(tag);
      if (idx >= 0) {
        const unbalanced = openStack.splice(idx).slice(1);
        out += unbalanced
          .reverse()
          .map((t) => `</${t}>`)
          .join('');
        out += `</${tag}>`;
      }
      continue;
    }

    if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'link' || tag === 'meta') {
      const closeIdx = input.toLowerCase().indexOf(`</${tag}`, TAG_RE.lastIndex);
      if (closeIdx >= 0) {
        TAG_RE.lastIndex = closeIdx + tag.length + 3;
        lastIndex = TAG_RE.lastIndex;
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) continue;

    const style = filterStyle(/style\s*=\s*"([^"]*)"/i.exec(rawAttrs)?.[1] ?? '');
    const attrs = style ? ` style="${escapeAttr(style)}"` : '';

    if (VOID_TAGS.has(tag)) {
      out += `<${tag}${attrs} />`;
      continue;
    }
    if (selfClose) {
      out += `<${tag}${attrs} />`;
      continue;
    }
    out += `<${tag}${attrs}>`;
    openStack.push(tag);
  }

  out += escapeText(input.slice(lastIndex));
  out += openStack.reverse().map((t) => `</${t}>`).join('');
  return out;
}

/**
 * Plain text → safe HTML (§61.4 mirror of the client `plainToHtml`):
 * escapes and wraps in a single `<p>`, matching the editor's output
 * shape so the transcription story renders identically before and
 * after a Mode-1 save. Empty text → '' (the client-joined story
 * fallback stays null, §31.6).
 * @param {string} text - The plain Amharic text.
 * @returns {string} `<p>escaped</p>` or ''.
 */
export function plainToHtml(text) {
  const value = String(text ?? '');
  return value ? `<p>${escapeText(value)}</p>` : '';
}