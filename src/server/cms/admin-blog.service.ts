/**
 * Admin-facing blog CRUD.
 *
 * The update path is one transaction:
 *   1. Update the post row + scalar SEO fields.
 *   2. Upsert SeoMeta + en-locale translation.
 *   3. Replace FAQ rows, CTA rows, internal-link rules, manual related pins.
 *   4. Sync the category and tag join tables.
 *   5. Cache derived metrics (reading minutes, word count, TOC).
 *
 * On the cache layer, all writes invalidate `cms:blog:post:<slug>` and the
 * index tag so changes are live immediately. Slug changes additionally
 * invalidate the old slug.
 */
import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readingMetrics, extractToc } from "@/lib/blog";
import { sanitizeRichHtml } from "@/lib/security/sanitize";
import type {
  BlogPostCreateInput,
  BlogPostUpdateInput,
  CategoryUpsertInput,
  TagUpsertInput,
  AuthorUpsertInput,
} from "@/lib/validators/blog";
import {
  BLOG_INDEX_TAG,
  invalidateBlogAuthor,
  invalidateBlogCategory,
  invalidateBlogPost,
  invalidateBlogTag,
} from "./blog.service";
import { revalidateTag } from "next/cache";

export const SLUG_TAKEN = "SLUG_TAKEN";

// ── List ────────────────────────────────────────────────────────────────────

export const BLOG_SORT_FIELDS = ["updatedAt", "publishedAt", "title", "status"] as const;
export type BlogSortField = (typeof BLOG_SORT_FIELDS)[number];

export interface ListAdminPostsParams {
  query?: string;
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  categoryId?: string;
  tagId?: string;
  authorId?: string;
  isFeatured?: boolean;
  sort?: BlogSortField;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function listAdminPosts(params: ListAdminPostsParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const sort: BlogSortField = BLOG_SORT_FIELDS.includes(params.sort as BlogSortField)
    ? (params.sort as BlogSortField)
    : "updatedAt";
  const order: "asc" | "desc" = params.order === "asc" ? "asc" : "desc";

  const where: Prisma.BlogPostWhereInput = {
    deletedAt: null,
    ...(params.query
      ? {
          OR: [
            { title: { contains: params.query, mode: "insensitive" } },
            { slug: { contains: params.query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.categoryId ? { categories: { some: { categoryId: params.categoryId } } } : {}),
    ...(params.tagId ? { tags: { some: { tagId: params.tagId } } } : {}),
    ...(params.authorId ? { authorId: params.authorId } : {}),
    ...(typeof params.isFeatured === "boolean" ? { isFeatured: params.isFeatured } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { [sort]: order } as Prisma.BlogPostOrderByWithRelationInput,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        isFeatured: true,
        publishedAt: true,
        updatedAt: true,
        readingMinutes: true,
        author: { select: { id: true, slug: true, translations: { select: { name: true, locale: true } } } },
        categories: { select: { category: { select: { id: true, slug: true } } } },
      },
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
}

// ── Read for editor ─────────────────────────────────────────────────────────

const adminPostInclude = {
  seo: { include: { translations: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  faqs: { orderBy: { order: "asc" } },
  ctaSlots: { orderBy: { order: "asc" } },
  internalLinks: { orderBy: { order: "asc" } },
  relatedFrom: { orderBy: { order: "asc" } },
} satisfies Prisma.BlogPostInclude;

export type AdminPostFull = Prisma.BlogPostGetPayload<{ include: typeof adminPostInclude }>;

export function getAdminPost(id: string): Promise<AdminPostFull | null> {
  return prisma.blogPost.findFirst({ where: { id, deletedAt: null }, include: adminPostInclude });
}

// ── Create / update ─────────────────────────────────────────────────────────

export async function createPost(input: BlogPostCreateInput) {
  try {
    return await prisma.blogPost.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        authorId: input.authorId ?? null,
        status: "DRAFT",
        body: "",
        bodyFormat: "HTML",
      },
      select: { id: true, slug: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function updatePost(id: string, input: BlogPostUpdateInput) {
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { slug: true, seoId: true },
  });
  if (!existing) throw new Error("NOT_FOUND");

  // Sanitize at the write boundary. Only HTML bodies go through the
  // sanitizer — MDX/Lexical have their own renderer and would be corrupted
  // by HTML-aware tag stripping.
  const safeBody = input.bodyFormat === "HTML" ? sanitizeRichHtml(input.body) : input.body;
  const safeFaqs = input.faqs.map((f) => ({ ...f, answer: sanitizeRichHtml(f.answer) }));
  const safeCtaSlots = input.ctaSlots.map((c) => ({
    ...c,
    body: c.body ? sanitizeRichHtml(c.body) : c.body,
  }));
  const metrics = readingMetrics(safeBody);
  const toc = extractToc(safeBody);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // SEO upsert (parent row + en translation).
      const seoId = await upsertSeo(tx, existing.seoId, {
        title: input.seoTitle ?? input.title,
        description: input.seoDescription ?? input.excerpt ?? null,
        keywords: input.seoKeywords ?? null,
        ogImageUrl: input.ogImageUrl || null,
      });

      // Replace child collections (simple, predictable diff strategy).
      await tx.blogPostFaq.deleteMany({ where: { postId: id } });
      if (safeFaqs.length) {
        await tx.blogPostFaq.createMany({
          data: safeFaqs.map((f, i) => ({
            postId: id,
            question: f.question,
            answer: f.answer,
            order: f.order ?? i,
          })),
        });
      }

      await tx.blogPostCta.deleteMany({ where: { postId: id } });
      if (safeCtaSlots.length) {
        await tx.blogPostCta.createMany({
          data: safeCtaSlots.map((c, i) => ({
            postId: id,
            placement: c.placement,
            variant: c.variant,
            anchor: c.anchor ?? null,
            paragraphIndex: c.paragraphIndex ?? null,
            heading: c.heading,
            body: c.body ?? null,
            primaryLabel: c.primaryLabel ?? null,
            primaryUrl: c.primaryUrl ?? null,
            secondaryLabel: c.secondaryLabel ?? null,
            secondaryUrl: c.secondaryUrl ?? null,
            formKey: c.formKey ?? null,
            backgroundImage: c.backgroundImage || null,
            isVisible: c.isVisible,
            order: c.order ?? i,
          })),
        });
      }

      await tx.blogPostInternalLink.deleteMany({ where: { postId: id } });
      if (input.internalLinks.length) {
        await tx.blogPostInternalLink.createMany({
          data: input.internalLinks.map((l, i) => ({
            postId: id,
            keyword: l.keyword,
            url: l.url,
            titleAttr: l.titleAttr ?? null,
            isActive: l.isActive,
            order: l.order ?? i,
          })),
        });
      }

      await tx.blogPostRelated.deleteMany({ where: { sourcePostId: id } });
      if (input.relatedPostIds.length) {
        await tx.blogPostRelated.createMany({
          data: input.relatedPostIds.map((targetId, i) => ({
            sourcePostId: id,
            targetPostId: targetId,
            order: i,
          })),
        });
      }

      // Sync category + tag joins.
      await tx.blogPostCategory.deleteMany({ where: { postId: id } });
      if (input.categoryIds.length) {
        await tx.blogPostCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({ postId: id, categoryId })),
        });
      }
      await tx.blogPostTag.deleteMany({ where: { postId: id } });
      if (input.tagIds.length) {
        await tx.blogPostTag.createMany({
          data: input.tagIds.map((tagId) => ({ postId: id, tagId })),
        });
      }

      // Update the post row last so SEO + relations exist when listeners read.
      return tx.blogPost.update({
        where: { id },
        data: {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt ?? null,
          body: safeBody,
          bodyFormat: input.bodyFormat,
          coverImageUrl: input.coverImageUrl || null,
          coverImageAlt: input.coverImageAlt ?? null,
          status: input.status,
          publishedAt: input.status === "PUBLISHED" ? new Date() : null,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          isFeatured: input.isFeatured,
          authorId: input.authorId || null,
          readingMinutes: metrics.minutes,
          wordCount: metrics.wordCount,
          toc: toc as unknown as Prisma.InputJsonValue,
          seoId,
        },
        select: { slug: true },
      });
    });

    invalidateBlogPost(existing.slug);
    if (existing.slug !== updated.slug) invalidateBlogPost(updated.slug);
    revalidateTag(BLOG_INDEX_TAG);
    return updated;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function softDeletePost(id: string) {
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } });
  if (!post) throw new Error("NOT_FOUND");
  await prisma.blogPost.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
  invalidateBlogPost(post.slug);
}

// ── Categories ──────────────────────────────────────────────────────────────

export async function upsertCategory(input: CategoryUpsertInput) {
  const data = {
    slug: input.slug,
    iconUrl: input.iconUrl || null,
    order: input.order,
    parentId: input.parentId || null,
  } satisfies Prisma.CategoryUncheckedCreateInput;

  try {
    const category = input.id
      ? await prisma.category.update({ where: { id: input.id }, data })
      : await prisma.category.create({ data });

    // Translation (en) + SEO.
    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: category.id, locale: "EN" } },
      update: { name: input.name, description: input.description ?? null },
      create: {
        categoryId: category.id,
        locale: "EN",
        name: input.name,
        description: input.description ?? null,
      },
    });

    if (input.seoTitle || input.seoDescription || input.ogImageUrl) {
      const seoId = await upsertSeo(prisma, category.seoId, {
        title: input.seoTitle ?? input.name,
        description: input.seoDescription ?? null,
        keywords: null,
        ogImageUrl: input.ogImageUrl || null,
      });
      if (category.seoId !== seoId) {
        await prisma.category.update({ where: { id: category.id }, data: { seoId } });
      }
    }

    invalidateBlogCategory(category.slug);
    return category;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
  if (!category) throw new Error("NOT_FOUND");
  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  invalidateBlogCategory(category.slug);
}

export async function listAdminCategories() {
  return prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { order: "asc" },
    include: { translations: true, _count: { select: { posts: true } } },
  });
}

// ── Tags ────────────────────────────────────────────────────────────────────

export async function upsertTag(input: TagUpsertInput) {
  try {
    const tag = input.id
      ? await prisma.tag.update({
          where: { id: input.id },
          data: { slug: input.slug, name: input.name },
        })
      : await prisma.tag.create({ data: { slug: input.slug, name: input.name } });
    invalidateBlogTag(tag.slug);
    return tag;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function deleteTag(id: string) {
  const tag = await prisma.tag.findUnique({ where: { id }, select: { slug: true } });
  if (!tag) throw new Error("NOT_FOUND");
  await prisma.tag.update({ where: { id }, data: { deletedAt: new Date() } });
  invalidateBlogTag(tag.slug);
}

export async function listAdminTags() {
  return prisma.tag.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

// ── Authors ─────────────────────────────────────────────────────────────────

export async function upsertAuthor(input: AuthorUpsertInput) {
  try {
    const data = {
      slug: input.slug,
      avatarUrl: input.avatarUrl || null,
      email: input.email || null,
      twitter: input.twitter ?? null,
      linkedin: input.linkedin ?? null,
    } satisfies Prisma.AuthorUncheckedCreateInput;

    const author = input.id
      ? await prisma.author.update({ where: { id: input.id }, data })
      : await prisma.author.create({ data });

    await prisma.authorTranslation.upsert({
      where: { authorId_locale: { authorId: author.id, locale: "EN" } },
      update: { name: input.name, title: input.title ?? null, bio: input.bio ?? null },
      create: {
        authorId: author.id,
        locale: "EN",
        name: input.name,
        title: input.title ?? null,
        bio: input.bio ?? null,
      },
    });

    invalidateBlogAuthor(author.slug);
    return author;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function deleteAuthor(id: string) {
  const author = await prisma.author.findUnique({ where: { id }, select: { slug: true } });
  if (!author) throw new Error("NOT_FOUND");
  await prisma.author.update({ where: { id }, data: { deletedAt: new Date() } });
  invalidateBlogAuthor(author.slug);
}

export async function listAdminAuthors() {
  return prisma.author.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { translations: true, _count: { select: { posts: true } } },
  });
}

// ── SEO upsert helper ───────────────────────────────────────────────────────
//
// `Prisma.TransactionClient` is a subset of `PrismaClient` (Omit of the
// `$*` connection methods) so both `prisma` and a `tx` inside `$transaction`
// satisfy this parameter type.

type SeoUpsertClient = Prisma.TransactionClient;

async function upsertSeo(
  client: SeoUpsertClient,
  existingSeoId: string | null,
  input: {
    title: string;
    description: string | null;
    keywords: string | null;
    ogImageUrl: string | null;
  },
): Promise<string> {
  const seo = existingSeoId
    ? await client.seoMeta.update({
        where: { id: existingSeoId },
        data: { ogImageUrl: input.ogImageUrl },
      })
    : await client.seoMeta.create({
        data: { ogImageUrl: input.ogImageUrl, robots: "index,follow" },
      });

  await client.seoMetaTranslation.upsert({
    where: { seoId_locale: { seoId: seo.id, locale: "EN" } },
    update: {
      title: input.title,
      description: input.description ?? null,
      keywords: input.keywords ?? null,
    },
    create: {
      seoId: seo.id,
      locale: "EN",
      title: input.title,
      description: input.description ?? null,
      keywords: input.keywords ?? null,
    },
  });

  return seo.id;
}
