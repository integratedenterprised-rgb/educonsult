/**
 * Table-of-contents extraction from post bodies.
 *
 * Walks headings (H2/H3 by default — H1 is reserved for the article title)
 * and emits a normalized list with stable `id` slugs that also get injected
 * back into the rendered HTML so anchor links resolve.
 *
 * Pure string transform — works in both the server (cache TOC at save time)
 * and the client (reading-progress / scroll-spy).
 */
import { slugify } from "@/lib/seo";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

const HEADING_RE = /<h([2-4])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
const TAG_RE = /<[^>]+>/g;

/**
 * Extract TOC entries from an HTML string. Ids are unique within the doc —
 * collisions get a `-2`, `-3`, … suffix so anchor links remain stable.
 */
export function extractToc(html: string): TocItem[] {
  if (!html) return [];
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  let m: RegExpExecArray | null;
  HEADING_RE.lastIndex = 0;
  while ((m = HEADING_RE.exec(html)) !== null) {
    const level = Number(m[1]) as 2 | 3 | 4;
    const text = stripTags(m[3] ?? "").trim();
    if (!text) continue;
    const base = slugify(text) || `section-${items.length + 1}`;
    const seenCount = seen.get(base) ?? 0;
    const id = seenCount === 0 ? base : `${base}-${seenCount + 1}`;
    seen.set(base, seenCount + 1);
    items.push({ id, text, level });
  }
  return items;
}

/**
 * Inject `id="…"` attributes into the rendered HTML headings so the TOC
 * anchors resolve. If a heading already has an id, it's left alone — this
 * keeps admin-authored anchors intact.
 *
 * Pairs with `extractToc` — the two must agree on the id calculation, so
 * both share the same `slugify` + collision-suffix rule.
 */
export function injectHeadingIds(html: string): { html: string; toc: TocItem[] } {
  if (!html) return { html: "", toc: [] };
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();

  const out = html.replace(HEADING_RE, (full, lvl: string, attrs: string | undefined, inner: string) => {
    const level = Number(lvl) as 2 | 3 | 4;
    const text = stripTags(inner).trim();
    if (!text) return full;
    const attrStr = attrs ?? "";
    const existingId = /\bid=["']([^"']+)["']/.exec(attrStr)?.[1];

    let id: string;
    if (existingId) {
      id = existingId;
    } else {
      const base = slugify(text) || `section-${toc.length + 1}`;
      const seenCount = seen.get(base) ?? 0;
      id = seenCount === 0 ? base : `${base}-${seenCount + 1}`;
      seen.set(base, seenCount + 1);
    }
    toc.push({ id, text, level });

    if (existingId) return full;
    return `<h${level}${attrStr} id="${id}">${inner}</h${level}>`;
  });

  return { html: out, toc };
}

function stripTags(s: string): string {
  return s.replace(TAG_RE, "");
}
