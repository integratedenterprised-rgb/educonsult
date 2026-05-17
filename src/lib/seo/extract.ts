/**
 * Extract SEO score inputs from a page's form values or persisted DTO.
 *
 * The page editor needs to compute the score reactively as the admin types.
 * That means we need to derive `bodyText`, `internalLinkCount`,
 * `externalLinkCount`, `hasFaq`, `hasH1`, and `sectionCount` from the
 * dynamic `sections` array — without knowing every block's specific data
 * shape ahead of time.
 *
 * This walker is intentionally tolerant: it inspects only the fields it knows
 * about and ignores the rest. Adding a new block type doesn't require touching
 * this file unless the new block's text/links should count.
 */
import type { Section } from "@/types/cms";

const INTERNAL_LINK = /^\/(?!\/)/;
const EXTERNAL_LINK = /^(https?:)?\/\//;
const TAG_PATTERN = /<[^>]+>/g;

interface MinimalSection {
  type: Section["type"];
  data: Record<string, unknown>;
}

export interface ExtractedSeoMetrics {
  bodyText: string;
  internalLinkCount: number;
  externalLinkCount: number;
  hasFaq: boolean;
  hasH1: boolean;
  sectionCount: number;
}

/**
 * Strip tags and collapse whitespace. Used on rich-text HTML and any other
 * potentially-HTML-bearing field so character-count scoring isn't inflated
 * by markup.
 */
function stripTags(s: string): string {
  return s.replace(TAG_PATTERN, " ").replace(/\s+/g, " ").trim();
}

function isUrlString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function classifyUrl(url: string, counts: { internal: number; external: number }) {
  if (INTERNAL_LINK.test(url)) counts.internal += 1;
  else if (EXTERNAL_LINK.test(url)) counts.external += 1;
}

function visitValue(value: unknown, textOut: string[], counts: { internal: number; external: number }): void {
  if (value == null) return;
  if (typeof value === "string") {
    if (isUrlString(value) && (INTERNAL_LINK.test(value) || EXTERNAL_LINK.test(value))) {
      classifyUrl(value, counts);
    } else {
      textOut.push(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) visitValue(v, textOut, counts);
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // CTA objects: { label, url } — count the URL, render the label as text.
      if ((k === "url" || k === "href") && isUrlString(v)) {
        classifyUrl(v, counts);
        continue;
      }
      visitValue(v, textOut, counts);
    }
  }
}

export function extractSeoMetrics(sections: MinimalSection[]): ExtractedSeoMetrics {
  const textBuffer: string[] = [];
  const counts = { internal: 0, external: 0 };
  let hasFaq = false;
  let hasH1 = false;

  for (const section of sections) {
    if (section.type === "faq") hasFaq = true;
    // The hero block's headline becomes the H1 in render output. Any
    // hero section with a non-empty headline satisfies "page has H1".
    if (section.type === "hero") {
      const headline = (section.data as { headline?: unknown }).headline;
      if (typeof headline === "string" && headline.trim().length > 0) hasH1 = true;
    }
    visitValue(section.data, textBuffer, counts);
  }

  return {
    bodyText: stripTags(textBuffer.join(" ")),
    internalLinkCount: counts.internal,
    externalLinkCount: counts.external,
    hasFaq,
    hasH1,
    sectionCount: sections.length,
  };
}
