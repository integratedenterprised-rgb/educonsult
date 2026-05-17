import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHomepage } from "@/server/cms/page.service";
import { getSiteSettings } from "@/server/cms/settings.service";
import { SectionRenderer } from "@/components/cms/section-renderer";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, webPageJsonLd, absoluteUrl } from "@/lib/seo";

// ISR — let the homepage live on the edge for 5 minutes between regenerations.
// Faster invalidation comes via tag-revalidation when admins edit the page.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getHomepage(), getSiteSettings()]);
  return buildMetadata(
    {
      title: page?.seo.title ?? settings.name,
      description: page?.seo.description ?? settings.tagline,
      keywords: page?.seo.keywords,
      ogImageUrl: page?.seo.ogImageUrl,
      canonicalPath: "/",
    },
    settings.name,
  );
}

export default async function HomePage() {
  const [page, settings] = await Promise.all([getHomepage(), getSiteSettings()]);
  if (!page) notFound();

  const pageLd = webPageJsonLd({
    title: page.seo.title ?? page.title,
    description: page.seo.description ?? settings.tagline,
    url: absoluteUrl("/"),
    ogImageUrl: page.seo.ogImageUrl,
  });

  return (
    <>
      <JsonLd data={pageLd} />
      <SectionRenderer sections={page.sections} />
    </>
  );
}
