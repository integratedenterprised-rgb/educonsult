/**
 * Public-facing blog reads.
 *
 *   - `getBlogPostBySlug(slug)`       — full post + author + categories + tags
 *                                       + FAQ + CTAs + internal links + related
 *   - `listBlogPosts({ … })`          — paginated index (filterable)
 *   - `listByCategory(slug, …)`       — category pages
 *   - `listByTag(slug, …)`            — tag pages
 *   - `getAuthorBySlug(slug)`         — author profile + recent posts
 *
 * All reads are wrapped in `unstable_cache` keyed by slug/query so the
 * page route just calls and renders. Admin writes invalidate by tag.
 */
import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";
import { rankRelated, type RelatedCandidate } from "@/lib/blog";

export const BLOG_INDEX_TAG = "cms:blog:index";
export const BLOG_POST_TAG = (slug: string) => `cms:blog:post:${slug}`;
export const BLOG_CATEGORY_TAG = (slug: string) => `cms:blog:category:${slug}`;
export const BLOG_TAG_TAG = (slug: string) => `cms:blog:tag:${slug}`;
export const BLOG_AUTHOR_TAG = (slug: string) => `cms:blog:author:${slug}`;

const postInclude = {
  author: { include: { translations: true } },
  categories: { include: { category: { include: { translations: true } } } },
  tags: { include: { tag: true } },
  seo: { include: { translations: true } },
  faqs: { orderBy: { order: "asc" }, include: { translations: true } },
  ctaSlots: { orderBy: { order: "asc" }, include: { translations: true } },
  internalLinks: { orderBy: { order: "asc" } },
  relatedFrom: {
    orderBy: { order: "asc" },
    include: {
      target: {
        include: {
          author: { include: { translations: true } },
          categories: { include: { category: true } },
        },
      },
    },
  },
} satisfies Prisma.BlogPostInclude;

export type BlogPostFull = Prisma.BlogPostGetPayload<{ include: typeof postInclude }>;

export const getBlogPostBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<BlogPostFull | null> => {
      const row = await prisma.blogPost.findFirst({
        where: { slug, status: "PUBLISHED", deletedAt: null },
        include: postInclude,
      });
      return row;
    },
    ["blog-post", slug],
    { revalidate: siteConfig.cache.page, tags: [BLOG_POST_TAG(slug), BLOG_INDEX_TAG] },
  )();

const summaryInclude = {
  author: { include: { translations: true } },
  categories: { include: { category: { include: { translations: true } } } },
  tags: { include: { tag: true } },
} satisfies Prisma.BlogPostInclude;

export type BlogPostSummary = Prisma.BlogPostGetPayload<{ include: typeof summaryInclude }>;

interface ListBlogParams {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  featured?: boolean;
  query?: string;
}

export interface BlogListResult {
  rows: BlogPostSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const listBlogPosts = (params: ListBlogParams = {}) => {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 12));

  const cacheKey = JSON.stringify({ ...params, page, pageSize });
  const tags = [BLOG_INDEX_TAG];
  if (params.categorySlug) tags.push(BLOG_CATEGORY_TAG(params.categorySlug));
  if (params.tagSlug) tags.push(BLOG_TAG_TAG(params.tagSlug));
  if (params.authorSlug) tags.push(BLOG_AUTHOR_TAG(params.authorSlug));

  return unstable_cache(
    async (): Promise<BlogListResult> => {
      const where: Prisma.BlogPostWhereInput = {
        deletedAt: null,
        status: "PUBLISHED",
        ...(params.categorySlug
          ? { categories: { some: { category: { slug: params.categorySlug } } } }
          : {}),
        ...(params.tagSlug ? { tags: { some: { tag: { slug: params.tagSlug } } } } : {}),
        ...(params.authorSlug ? { author: { slug: params.authorSlug } } : {}),
        ...(typeof params.featured === "boolean" ? { isFeatured: params.featured } : {}),
        ...(params.query
          ? {
              OR: [
                { title: { contains: params.query, mode: "insensitive" } },
                { excerpt: { contains: params.query, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [rows, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: summaryInclude,
        }),
        prisma.blogPost.count({ where }),
      ]);

      return {
        rows,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
    ["blog-list", cacheKey],
    { revalidate: siteConfig.cache.page, tags },
  )();
};

export interface CategoryFull {
  id: string;
  slug: string;
  iconUrl: string | null;
  name: string;
  description: string | null;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
    ogImageUrl: string | null;
  };
  postCount: number;
}

export const getCategoryBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<CategoryFull | null> => {
      const row = await prisma.category.findFirst({
        where: { slug, deletedAt: null },
        include: { translations: true, seo: { include: { translations: true } } },
      });
      if (!row) return null;
      const t = row.translations.find((x) => x.locale === "EN") ?? row.translations[0];
      const seoT = row.seo?.translations.find((x) => x.locale === "EN") ?? row.seo?.translations[0];
      const postCount = await prisma.blogPost.count({
        where: { deletedAt: null, status: "PUBLISHED", categories: { some: { categoryId: row.id } } },
      });
      return {
        id: row.id,
        slug: row.slug,
        iconUrl: row.iconUrl,
        name: t?.name ?? row.slug,
        description: t?.description ?? null,
        seo: {
          title: seoT?.title ?? null,
          description: seoT?.description ?? null,
          keywords: seoT?.keywords ?? null,
          ogImageUrl: row.seo?.ogImageUrl ?? null,
        },
        postCount,
      };
    },
    ["blog-category", slug],
    { revalidate: siteConfig.cache.page, tags: [BLOG_CATEGORY_TAG(slug)] },
  )();

export interface AuthorFull {
  id: string;
  slug: string;
  avatarUrl: string | null;
  email: string | null;
  twitter: string | null;
  linkedin: string | null;
  name: string;
  title: string | null;
  bio: string | null;
  postCount: number;
}

export const getAuthorBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<AuthorFull | null> => {
      const row = await prisma.author.findFirst({
        where: { slug, deletedAt: null },
        include: { translations: true },
      });
      if (!row) return null;
      const t = row.translations.find((x) => x.locale === "EN") ?? row.translations[0];
      const postCount = await prisma.blogPost.count({
        where: { authorId: row.id, status: "PUBLISHED", deletedAt: null },
      });
      return {
        id: row.id,
        slug: row.slug,
        avatarUrl: row.avatarUrl,
        email: row.email,
        twitter: row.twitter,
        linkedin: row.linkedin,
        name: t?.name ?? row.slug,
        title: t?.title ?? null,
        bio: t?.bio ?? null,
        postCount,
      };
    },
    ["blog-author", slug],
    { revalidate: siteConfig.cache.page, tags: [BLOG_AUTHOR_TAG(slug)] },
  )();

export interface ListedCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  postCount: number;
}

export const listCategories = unstable_cache(
  async (): Promise<ListedCategory[]> => {
    const rows = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
    });
    return rows.map((r) => {
      const t = r.translations.find((x) => x.locale === "EN") ?? r.translations[0];
      return {
        id: r.id,
        slug: r.slug,
        iconUrl: r.iconUrl,
        name: t?.name ?? r.slug,
        description: t?.description ?? null,
        postCount: r._count.posts,
      };
    });
  },
  ["blog-categories"],
  { revalidate: siteConfig.cache.page, tags: [BLOG_INDEX_TAG] },
);

/**
 * Compute related posts for `postId`.
 *
 * Manual pins on `BlogPostRelated` win. Otherwise we pull up to 30
 * recent candidates (same categories OR tags OR author) and run the
 * ranker. Returned summaries are safe to render directly.
 */
export async function getRelatedPosts(post: BlogPostFull, limit = 3): Promise<BlogPostSummary[]> {
  if (post.relatedFrom.length > 0) {
    const ids = post.relatedFrom.map((r) => r.targetPostId);
    const rows = await prisma.blogPost.findMany({
      where: { id: { in: ids }, status: "PUBLISHED", deletedAt: null },
      include: summaryInclude,
    });
    // Preserve admin-chosen order.
    return ids
      .map((id) => rows.find((r) => r.id === id))
      .filter((r): r is BlogPostSummary => Boolean(r));
  }

  const categoryIds = post.categories.map((c) => c.categoryId);
  const tagIds = post.tags.map((t) => t.tagId);

  const candidates = await prisma.blogPost.findMany({
    where: {
      id: { not: post.id },
      status: "PUBLISHED",
      deletedAt: null,
      OR: [
        categoryIds.length ? { categories: { some: { categoryId: { in: categoryIds } } } } : {},
        tagIds.length ? { tags: { some: { tagId: { in: tagIds } } } } : {},
        post.authorId ? { authorId: post.authorId } : {},
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 30,
    include: summaryInclude,
  });

  const ranked = rankRelated(
    {
      id: post.id,
      authorId: post.authorId,
      categoryIds,
      tagIds,
    },
    candidates.map<RelatedCandidate>((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      excerpt: c.excerpt,
      coverImageUrl: c.coverImageUrl,
      publishedAt: c.publishedAt,
      readingMinutes: c.readingMinutes,
      authorId: c.authorId,
      categoryIds: c.categories.map((x) => x.categoryId),
      tagIds: c.tags.map((x) => x.tagId),
    })),
    limit,
  );
  const map = new Map(candidates.map((c) => [c.id, c] as const));
  return ranked.map((r) => map.get(r.id)).filter((r): r is BlogPostSummary => Boolean(r));
}

// ── Invalidation primitives — re-exported for admin services ────────────────

export function invalidateBlogPost(slug: string) {
  revalidateTag(BLOG_POST_TAG(slug));
  revalidateTag(BLOG_INDEX_TAG);
}
export function invalidateBlogIndex() {
  revalidateTag(BLOG_INDEX_TAG);
}
export function invalidateBlogCategory(slug: string) {
  revalidateTag(BLOG_CATEGORY_TAG(slug));
  revalidateTag(BLOG_INDEX_TAG);
}
export function invalidateBlogTag(slug: string) {
  revalidateTag(BLOG_TAG_TAG(slug));
  revalidateTag(BLOG_INDEX_TAG);
}
export function invalidateBlogAuthor(slug: string) {
  revalidateTag(BLOG_AUTHOR_TAG(slug));
  revalidateTag(BLOG_INDEX_TAG);
}
