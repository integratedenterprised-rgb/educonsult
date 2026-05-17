import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";
import type { CmsPage, Section } from "@/types/cms";

const PAGE_TAG = (slug: string) => `cms:page:${slug}`;

function toCmsPage(row: {
  id: string;
  slug: string;
  title: string;
  isHomepage: boolean;
  template: string | null;
  sections: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImageUrl: string | null;
}): CmsPage {
  const sections = Array.isArray(row.sections) ? (row.sections as Section[]) : [];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    isHomepage: row.isHomepage,
    template: row.template,
    sections: sections.filter((s) => s.isVisible !== false).sort((a, b) => a.order - b.order),
    seo: {
      title: row.seoTitle,
      description: row.seoDescription,
      keywords: row.seoKeywords,
      ogImageUrl: row.ogImageUrl,
    },
  };
}

export const getPageBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<CmsPage | null> => {
      const row = await prisma.page.findFirst({
        where: { slug, status: "PUBLISHED", deletedAt: null },
      });
      return row ? toCmsPage(row) : null;
    },
    ["page", slug],
    { revalidate: siteConfig.cache.page, tags: [PAGE_TAG(slug)] },
  )();

export const getHomepage = unstable_cache(
  async (): Promise<CmsPage | null> => {
    const row = await prisma.page.findFirst({
      where: { isHomepage: true, status: "PUBLISHED", deletedAt: null },
    });
    return row ? toCmsPage(row) : null;
  },
  ["page-homepage"],
  { revalidate: siteConfig.cache.page, tags: ["cms:page:home"] },
);

export function invalidatePage(slug: string) {
  revalidateTag(PAGE_TAG(slug));
}
