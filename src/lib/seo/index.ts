/**
 * SEO module barrel.
 *
 *   import { buildMetadata, webPageJsonLd, scoreSeo } from "@/lib/seo";
 */
export { buildMetadata, absoluteUrl, type SeoInput } from "./metadata";
export {
  organizationJsonLd,
  websiteJsonLd,
  webPageJsonLd,
  articleJsonLd,
  courseJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  reviewJsonLd,
  type JsonLd,
} from "./json-ld";
export { scoreSeo, type SeoIssue, type SeoScoreInput, type SeoScoreResult } from "./score";
export {
  autoInternalLink,
  DEFAULT_LINK_RULES,
  type LinkRule,
} from "./internal-links";
export { slugify, slugFromQuery, isValidSlug, joinSlugSegments } from "./slug";
export { extractSeoMetrics, type ExtractedSeoMetrics } from "./extract";
