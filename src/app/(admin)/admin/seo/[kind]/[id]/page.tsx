import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/session";
import { getSeoForTarget, type SeoTargetType } from "@/server/seo/admin-seo.service";
import { SeoForm } from "@/components/admin/seo/seo-form";

const VALID: SeoTargetType[] = ["page", "post", "country", "category", "resource", "pathway", "course", "prPathway"];

export const dynamic = "force-dynamic";

export default async function SeoEditPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  await requirePermission("seo.write");
  const { kind, id } = await params;
  if (!VALID.includes(kind as SeoTargetType)) notFound();
  const seo = await getSeoForTarget(kind as SeoTargetType, id);

  const initial = {
    title: seo?.translations[0]?.title ?? "",
    description: seo?.translations[0]?.description ?? "",
    keywords: seo?.translations[0]?.keywords ?? "",
    ogTitle: seo?.translations[0]?.ogTitle ?? "",
    ogDescription: seo?.translations[0]?.ogDescription ?? "",
    ogImageUrl: seo?.ogImageUrl ?? "",
    canonicalUrl: seo?.canonicalUrl ?? "",
    robots: seo?.robots ?? "index,follow",
    twitterCardType: seo?.twitterCardType ?? "summary_large_image",
    structuredData: seo?.structuredData ? JSON.stringify(seo.structuredData, null, 2) : "",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Edit SEO</h1>
        <p className="mt-1 text-sm text-muted-foreground capitalize">{kind} · {id}</p>
      </div>
      <SeoForm targetType={kind as SeoTargetType} targetId={id} initial={initial} />
    </div>
  );
}
