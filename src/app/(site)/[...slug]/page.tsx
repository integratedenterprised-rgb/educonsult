import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "@/server/cms/page.service";

// CMS-driven catch-all route. ISR — pages re-render every 5 minutes; admin
// edits trigger immediate revalidation via `cms:page:{slug}` cache tags.
// Unmatched slugs that weren't pre-rendered are generated on first hit and
// then cached at the edge (default `dynamicParams: true`).
export const revalidate = 300;

/**
 * Pre-render every published CMS page at build time so the first visitor
 * always hits a warm edge cache. New pages added after deploy fall back to
 * on-demand ISR generation.
 */
export async function generateStaticParams() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const pages = await prisma.page.findMany({
      where: { status: "PUBLISHED", isHomepage: false, deletedAt: null },
      select: { slug: true },
    });
    return pages.map((p) => ({ slug: p.slug.split("/").filter(Boolean) }));
  } catch {
    // DB unreachable at build time (e.g. inside Docker build stage). Fall back
    // to on-demand ISR — pages render on first request and cache thereafter.
    return [];
  }
}
import { getSiteSettings } from "@/server/cms/settings.service";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { Breadcrumbs, breadcrumbsFromSlugPath } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, webPageJsonLd, absoluteUrl } from "@/lib/seo";

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

function joinSlug(parts: string[]) {
  return parts.join("/");
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPageBySlug(joinSlug(slug)), getSiteSettings()]);
  if (!page) return buildMetadata({ title: "Not found", noIndex: true }, settings.name);
  return buildMetadata(
    {
      title: page.seo.title ?? page.title,
      description: page.seo.description,
      keywords: page.seo.keywords,
      ogImageUrl: page.seo.ogImageUrl,
      canonicalPath: `/${joinSlug(slug)}`,
    },
    settings.name,
  );
}

export default async function DynamicCmsPage({ params }: RouteParams) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPageBySlug(joinSlug(slug)), getSiteSettings()]);
  if (!page) notFound();

  const canonicalPath = `/${joinSlug(slug)}`;
  const pageLd = webPageJsonLd({
    title: page.seo.title ?? page.title,
    description: page.seo.description ?? settings.tagline,
    url: absoluteUrl(canonicalPath),
    ogImageUrl: page.seo.ogImageUrl,
  });
  const crumbs = breadcrumbsFromSlugPath(slug, page.title);

  return (
    <>
      <JsonLd data={pageLd} />
      <Breadcrumbs items={crumbs} className="pt-6" />
      <SectionRenderer sections={page.sections} />
    </>
  );
}
