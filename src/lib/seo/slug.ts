/**
 * Slug helpers — generate, normalize, and validate URL slugs.
 *
 * The CMS uses canonical lowercase-hyphenated slugs. Programmatic SEO pages
 * lean on `slugFromQuery` to convert a target search query into a slug
 * (e.g. "Study in Australia from Nepal" → "study-in-australia-from-nepal").
 */

const NON_ALNUM = /[^a-z0-9]+/g;
const TRIM_HYPHENS = /^-+|-+$/g;
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "for",
  "of",
  "to",
  "with",
  "is",
  "are",
  "was",
  "were",
]);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(NON_ALNUM, "-")
    .replace(TRIM_HYPHENS, "");
}

/**
 * Slugify, but skip very common stop words ("a", "the", "is", …) so the
 * resulting slug keeps the keyword-dense tokens.
 *
 * "Are you eligible for an Australian visa?"
 *   → "you-eligible-australian-visa"
 */
export function slugFromQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(NON_ALNUM, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token))
    .join("-");
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Join nested path segments into a CMS slug. */
export function joinSlugSegments(segments: string[]): string {
  return segments.filter(Boolean).join("/");
}
