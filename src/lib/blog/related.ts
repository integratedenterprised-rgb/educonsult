/**
 * Related-post ranking.
 *
 * Manual pins from `BlogPostRelated` win when present. Otherwise we score
 * candidate posts by:
 *   - shared categories  (×3 — strongest topical signal)
 *   - shared tags        (×2)
 *   - same author        (×1)
 *   - recency boost      (newer posts up to +1)
 *
 * The ranker is pure — it takes the candidate set the service already
 * fetched and orders it, with no DB access. That keeps it testable and
 * keeps caching boundaries clean.
 */

export interface RelatedCandidate {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  readingMinutes: number | null;
  authorId: string | null;
  categoryIds: string[];
  tagIds: string[];
}

export interface RelatedTarget {
  id: string;
  authorId: string | null;
  categoryIds: string[];
  tagIds: string[];
}

export function rankRelated(
  target: RelatedTarget,
  candidates: RelatedCandidate[],
  limit = 3,
): RelatedCandidate[] {
  const targetCats = new Set(target.categoryIds);
  const targetTags = new Set(target.tagIds);
  const now = Date.now();

  const scored = candidates
    .filter((c) => c.id !== target.id)
    .map((c) => {
      const catOverlap = c.categoryIds.filter((id) => targetCats.has(id)).length;
      const tagOverlap = c.tagIds.filter((id) => targetTags.has(id)).length;
      const sameAuthor = c.authorId && c.authorId === target.authorId ? 1 : 0;
      const ageDays = c.publishedAt ? (now - c.publishedAt.getTime()) / 86_400_000 : 999;
      // Linear decay: full +1 at 0d, fades to 0 at ~180d, then 0.
      const recency = Math.max(0, 1 - ageDays / 180);
      const score = catOverlap * 3 + tagOverlap * 2 + sameAuthor + recency;
      return { post: c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.post);
}
