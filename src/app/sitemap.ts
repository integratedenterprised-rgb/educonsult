import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";

/**
 * Sitemap generator.
 *
 * Reads every PUBLISHED page from the CMS, plus future entity types as they
 * land (blog posts, countries, course pathways, resources — wired but
 * commented while those tables only exist in the target schema).
 *
 * `changeFrequency` and `priority` are heuristics derived from page metadata,
 * not literal truth — search engines use them as hints and apply their own
 * crawl budgeting on top.
 */
export const revalidate = 3600; // re-render sitemap at most once per hour

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

function changeFrequencyFor(template: string | null, isHomepage: boolean): ChangeFrequency {
  if (isHomepage) return "daily";
  switch (template) {
    case "landing":
    case "seo-landing":
      return "weekly";
    case "country":
    case "pathway":
      return "monthly";
    case "legal":
      return "yearly";
    default:
      return "weekly";
  }
}

function priorityFor(template: string | null, isHomepage: boolean): number {
  if (isHomepage) return 1.0;
  switch (template) {
    case "landing":
    case "seo-landing":
      return 0.85;
    case "country":
    case "pathway":
      return 0.8;
    case "legal":
      return 0.3;
    default:
      return 0.6;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts, categories, tags, authors] = await Promise.all([
    prisma.page.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, isHomepage: true, updatedAt: true, template: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true, isFeatured: true },
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.tag.findMany({
      where: { deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.author.findMany({
      where: { deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${siteConfig.url}${p.isHomepage ? "/" : `/${p.slug}`}`,
    lastModified: p.updatedAt,
    changeFrequency: changeFrequencyFor(p.template, p.isHomepage),
    priority: priorityFor(p.template, p.isHomepage),
  }));

  if (posts.length > 0) {
    entries.push({
      url: `${siteConfig.url}/blog`,
      lastModified: posts[0]!.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const p of posts) {
    entries.push({
      url: `${siteConfig.url}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: p.isFeatured ? 0.7 : 0.6,
    });
  }

  for (const c of categories) {
    entries.push({
      url: `${siteConfig.url}/blog/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  for (const t of tags) {
    entries.push({
      url: `${siteConfig.url}/blog/tag/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly",
      priority: 0.3,
    });
  }

  for (const a of authors) {
    entries.push({
      url: `${siteConfig.url}/authors/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  return entries;
}
