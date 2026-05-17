/**
 * Admin CRUD for SeoMeta records. Each SeoMeta is attached to a single entity
 * (Page, BlogPost, Country, Resource, etc.) via the entity's `seoId` FK.
 *
 * On save, the public cache tag for the underlying entity is invalidated.
 */
import "server-only";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Locale, Prisma } from "@prisma/client";

export const NOT_FOUND = "NOT_FOUND";

export type SeoTargetType = "page" | "post" | "country" | "category" | "resource" | "pathway" | "course" | "prPathway";

export async function listSeoTargets() {
  const [pages, posts, countries, resources] = await Promise.all([
    prisma.page.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, title: true, seoId: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.blogPost.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, title: true, seoId: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.country.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, seoId: true, status: true, translations: { take: 1, select: { name: true } } },
    }),
    prisma.resource.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, seoId: true, status: true, translations: { take: 1, select: { title: true } } },
    }),
  ]);
  return {
    pages: pages.map((p) => ({ ...p, kind: "page" as const })),
    posts: posts.map((p) => ({ ...p, kind: "post" as const })),
    countries: countries.map((c) => ({
      id: c.id, slug: c.slug, seoId: c.seoId, status: c.status,
      title: c.translations[0]?.name ?? c.slug, kind: "country" as const,
    })),
    resources: resources.map((r) => ({
      id: r.id, slug: r.slug, seoId: r.seoId, status: r.status,
      title: r.translations[0]?.title ?? r.slug, kind: "resource" as const,
    })),
  };
}

export interface SeoUpsertInput {
  targetType: SeoTargetType;
  targetId: string;
  title: string;
  description?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  robots?: string | null;
  twitterCardType?: string | null;
  structuredData?: unknown;
  locale?: Locale;
}

const TARGET_TAG: Record<SeoTargetType, (slug: string) => string> = {
  page: (s) => `cms:page:${s}`,
  post: (s) => `cms:post:${s}`,
  country: (s) => `cms:country:${s}`,
  category: (s) => `cms:category:${s}`,
  resource: (s) => `cms:resource:${s}`,
  pathway: (s) => `cms:pathway:${s}`,
  course: (s) => `cms:course:${s}`,
  prPathway: (s) => `cms:pr-pathway:${s}`,
};

async function ensureSeoFor(targetType: SeoTargetType, targetId: string) {
  const model = prisma[targetType as keyof typeof prisma] as unknown as {
    findUnique(args: { where: { id: string }; select: Record<string, boolean> }): Promise<{ seoId: string | null; slug: string } | null>;
    update(args: { where: { id: string }; data: { seoId: string } }): Promise<unknown>;
  };

  const row = await model.findUnique({ where: { id: targetId }, select: { seoId: true, slug: true } });
  if (!row) throw new Error(NOT_FOUND);
  if (row.seoId) return { seoId: row.seoId, slug: row.slug };

  const created = await prisma.seoMeta.create({ data: {} });
  await model.update({ where: { id: targetId }, data: { seoId: created.id } });
  return { seoId: created.id, slug: row.slug };
}

export async function upsertSeo(input: SeoUpsertInput) {
  const { seoId, slug } = await ensureSeoFor(input.targetType, input.targetId);
  const locale: Locale = input.locale ?? "EN";

  await prisma.$transaction([
    prisma.seoMeta.update({
      where: { id: seoId },
      data: {
        canonicalUrl: input.canonicalUrl ?? null,
        robots: input.robots ?? "index,follow",
        ogImageUrl: input.ogImageUrl ?? null,
        twitterCardType: input.twitterCardType ?? "summary_large_image",
        structuredData: (input.structuredData ?? null) as Prisma.InputJsonValue,
      },
    }),
    prisma.seoMetaTranslation.upsert({
      where: { seoId_locale: { seoId, locale } },
      update: {
        title: input.title,
        description: input.description ?? null,
        keywords: input.keywords ?? null,
        ogTitle: input.ogTitle ?? null,
        ogDescription: input.ogDescription ?? null,
      },
      create: {
        seoId, locale,
        title: input.title,
        description: input.description ?? null,
        keywords: input.keywords ?? null,
        ogTitle: input.ogTitle ?? null,
        ogDescription: input.ogDescription ?? null,
      },
    }),
  ]);

  revalidateTag(TARGET_TAG[input.targetType](slug));
}

export async function getSeoForTarget(targetType: SeoTargetType, targetId: string, locale: Locale = "EN") {
  const model = prisma[targetType as keyof typeof prisma] as unknown as {
    findUnique(args: { where: { id: string }; select: Record<string, unknown> }): Promise<{ seoId: string | null } | null>;
  };
  const row = await model.findUnique({ where: { id: targetId }, select: { seoId: true } });
  if (!row || !row.seoId) return null;
  return prisma.seoMeta.findUnique({
    where: { id: row.seoId },
    include: { translations: { where: { locale } } },
  });
}
