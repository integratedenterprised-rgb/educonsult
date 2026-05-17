/**
 * Input sanitization for user-controlled HTML/text.
 *
 * Three tiers:
 *  - `sanitizeRichHtml`  — for trusted-author rich-text fields (blog body,
 *                          RICH_TEXT section). Permissive but strips script,
 *                          event handlers, javascript:/data: URLs.
 *  - `sanitizeBasicHtml` — minimal formatting only (form descriptions,
 *                          testimonial quotes). No images, no links.
 *  - `sanitizeText`      — plain text. Strips ALL tags + collapses whitespace.
 *
 * All three are XSS-safe by construction: they parse with a deny-by-default
 * allow-list, never with a regex. Run sanitization at the *write* boundary
 * (when we accept admin input) so reads stay fast and the stored value is
 * always safe to render.
 *
 * Dependency: `sanitize-html` (DOM-aware, maintained, used in production by
 * Mozilla/Stack Overflow). We import lazily so the public site bundle isn't
 * polluted — only API routes and server actions reach this file.
 */
import "server-only";
import sanitizeHtml from "sanitize-html";

const RICH_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "em", "u", "s", "code", "mark", "sub", "sup",
    "ul", "ol", "li",
    "blockquote",
    "pre",
    "a",
    "img",
    "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    span: ["class"],
    div: ["class"],
    code: ["class"],
    pre: ["class"],
    th: ["scope", "colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  // Only http(s) and protocol-relative. `javascript:`, `data:`, and `vbscript:`
  // get stripped entirely.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  // Force safe link attributes — prevents reverse tabnabbing.
  transformTags: {
    a: (tagName, attribs) => {
      const out: Record<string, string> = { ...attribs };
      if (out.target === "_blank") {
        const rel = new Set((out.rel ?? "").split(/\s+/).filter(Boolean));
        rel.add("noopener");
        rel.add("noreferrer");
        out.rel = Array.from(rel).join(" ");
      }
      return { tagName, attribs: out };
    },
  },
  disallowedTagsMode: "discard",
  enforceHtmlBoundary: true,
};

const BASIC_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "ul", "ol", "li"],
  allowedAttributes: {},
  allowedSchemes: [],
  disallowedTagsMode: "discard",
};

export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, RICH_OPTIONS);
}

export function sanitizeBasicHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, BASIC_OPTIONS);
}

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  const stripped = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return stripped.replace(/\s+/g, " ").trim();
}

/**
 * Sanitize the `data.html` field of every `richText` section in a CMS page's
 * section array. The array is treated as opaque JSON in Prisma, so we don't
 * have type-safe access — we duck-type on `type === "richText"` and the
 * presence of `data.html`. Other section types pass through unchanged.
 *
 * Use this on the WRITE path inside admin services so the stored value is
 * already safe; render-side `dangerouslySetInnerHTML` then has nothing to do.
 */
export function sanitizeSectionsHtml<T>(sections: T): T {
  if (!Array.isArray(sections)) return sections;
  return sections.map((section) => {
    if (!section || typeof section !== "object") return section;
    const s = section as Record<string, unknown>;
    if (s.type !== "richText") return section;
    const data = s.data as Record<string, unknown> | undefined;
    if (!data || typeof data.html !== "string") return section;
    return { ...s, data: { ...data, html: sanitizeRichHtml(data.html) } };
  }) as unknown as T;
}

/**
 * Recursively sanitize plain-text leaves in a nested object. Use for JSON
 * blobs (e.g. CMS section data) where we don't have a typed schema for every
 * field but want defense-in-depth against accidental HTML injection.
 *
 * Keys are passed through unchanged — only string *values* are sanitized.
 * Non-string leaves (numbers, booleans, null) pass through.
 */
export function sanitizeJsonText<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return sanitizeText(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeJsonText(v)) as unknown as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeJsonText(v);
    }
    return out as T;
  }
  return value;
}
