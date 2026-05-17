/**
 * Blog helpers barrel — TOC, reading time, body renderer, related ranking,
 * JSON-LD bundlers. Public entry point so callers don't import deep paths.
 */
export { extractToc, injectHeadingIds, type TocItem } from "./toc";
export { readingMetrics, type ReadingMetrics } from "./reading";
export {
  renderBody,
  type RenderInput,
  type RenderResult,
  type CtaPlacement,
} from "./render";
export {
  rankRelated,
  type RelatedCandidate,
  type RelatedTarget,
} from "./related";
export {
  blogPostJsonLd,
  blogListingJsonLd,
  type BlogPostingInput,
  type BlogPostJsonLdBundle,
} from "./json-ld";
