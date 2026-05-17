/**
 * SEO scoring utility.
 *
 * Takes a page's content + metadata and returns a 0–100 score plus a list of
 * issues. Designed for use inside the page editor — show the score
 * alongside the SEO panel so admins know what to fix before publishing.
 *
 * Scoring is opinionated but conservative. Each issue subtracts a fixed
 * amount; the score floor is 0. Don't ship pages with score < 70 publicly.
 */

export type SeoIssueLevel = "info" | "warning" | "error";

export interface SeoIssue {
  level: SeoIssueLevel;
  message: string;
  field?: string;
}

export interface SeoScoreInput {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  slug: string;
  ogImageUrl?: string | null;
  bodyText?: string | null;
  hasFaq?: boolean;
  internalLinkCount?: number;
  externalLinkCount?: number;
  hasH1?: boolean;
  sectionCount?: number;
}

export interface SeoScoreResult {
  score: number;
  issues: SeoIssue[];
}

const TITLE_MIN = 20;
const TITLE_MAX = 65;
const DESC_MIN = 70;
const DESC_MAX = 165;
const BODY_MIN = 300;

export function scoreSeo(input: SeoScoreInput): SeoScoreResult {
  const issues: SeoIssue[] = [];
  let score = 100;

  // ── Title ──────────────────────────────────────────────────────────────
  const title = (input.metaTitle ?? input.title ?? "").trim();
  if (!title) {
    issues.push({ level: "error", field: "metaTitle", message: "Title is missing" });
    score -= 25;
  } else if (title.length < TITLE_MIN) {
    issues.push({
      level: "warning",
      field: "metaTitle",
      message: `Title is short (${title.length} chars; aim for ${TITLE_MIN}–${TITLE_MAX})`,
    });
    score -= 8;
  } else if (title.length > TITLE_MAX) {
    issues.push({
      level: "warning",
      field: "metaTitle",
      message: `Title may truncate in SERPs (${title.length} > ${TITLE_MAX})`,
    });
    score -= 5;
  }

  // ── Description ────────────────────────────────────────────────────────
  const desc = (input.metaDescription ?? "").trim();
  if (!desc) {
    issues.push({ level: "error", field: "metaDescription", message: "Meta description is missing" });
    score -= 20;
  } else if (desc.length < DESC_MIN) {
    issues.push({
      level: "warning",
      field: "metaDescription",
      message: `Description is short (${desc.length} chars; aim for ${DESC_MIN}–${DESC_MAX})`,
    });
    score -= 8;
  } else if (desc.length > DESC_MAX) {
    issues.push({
      level: "warning",
      field: "metaDescription",
      message: `Description may truncate (${desc.length} > ${DESC_MAX})`,
    });
    score -= 5;
  }

  // ── Slug ───────────────────────────────────────────────────────────────
  if (input.slug.length < 3) {
    issues.push({ level: "warning", field: "slug", message: "Slug is too short" });
    score -= 5;
  } else if (input.slug.length > 75) {
    issues.push({ level: "warning", field: "slug", message: "Slug is long; trim filler words" });
    score -= 3;
  }
  if (/[A-Z_]/.test(input.slug) || / /.test(input.slug)) {
    issues.push({ level: "error", field: "slug", message: "Slug should be lowercase-hyphenated" });
    score -= 10;
  }

  // ── OG image ───────────────────────────────────────────────────────────
  if (!input.ogImageUrl) {
    issues.push({
      level: "warning",
      field: "ogImageUrl",
      message: "Add a 1200×630 social image for richer link previews",
    });
    score -= 6;
  }

  // ── Body length ────────────────────────────────────────────────────────
  const bodyLen = input.bodyText?.trim().length ?? 0;
  if (bodyLen < BODY_MIN) {
    issues.push({
      level: "warning",
      message: `Visible text is thin (${bodyLen} chars; aim for ${BODY_MIN}+)`,
    });
    score -= 10;
  }

  // ── Structural hints ───────────────────────────────────────────────────
  if (input.hasH1 === false) {
    issues.push({ level: "error", message: "No H1 found on the page" });
    score -= 12;
  }
  if (input.sectionCount === 0) {
    issues.push({ level: "warning", message: "Page has no sections" });
    score -= 5;
  }
  if (input.hasFaq === false) {
    issues.push({
      level: "info",
      message: "Adding a FAQ block lets you claim FAQ rich results",
    });
    score -= 2;
  }
  if ((input.internalLinkCount ?? 0) < 2) {
    issues.push({
      level: "info",
      message: "Add at least 2 internal links for crawl-depth and authority flow",
    });
    score -= 3;
  }

  return { score: Math.max(0, Math.round(score)), issues };
}
