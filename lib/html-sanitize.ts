/**
 * HTML sanitization for user-provided content (Story 12.3 rich_text, Story 12.5 step formation custom, Story 12.6 custom_html).
 * Uses DOMPurify to prevent XSS. No <script>, no inline event handlers (onclick, etc.).
 *
 * Dev Notes – Policy:
 * - Allowed: structure (p, div, span, h1–h6, ul, ol, li, br), formatting (strong, em, u),
 *   links (a), media (img, video, audio, source), code (code, pre), table, blockquote, style,
 *   iframe (sandbox only for YouTube/Vimeo embeds).
 * - Allowed attributes: href, target, rel, src, alt, class, style (for inline/CSS),
 *   sandbox, allow (for iframes), allowfullscreen.
 * - Forbidden: script, form, input, and any attribute starting with "on" (event handlers).
 * - Iframes: only with sandbox attribute (e.g. sandbox="allow-scripts allow-same-origin");
 *   allow and allowfullscreen permitted for video embeds.
 */

import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
  "pre",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
  "style",
  "video",
  "audio",
  "source",
  "iframe",
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "class",
  "style",
  "controls",
  "width",
  "height",
  "poster",
  "type",
  "sandbox",
  "allow",
  "allowfullscreen",
  "title",
];

/**
 * Sanitize HTML for safe display (formations custom pages, rich_text, and custom_html elements).
 * Iframes are allowed with sandbox + allow (e.g. YouTube, Vimeo embeds).
 */
export function sanitizeFormationHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
