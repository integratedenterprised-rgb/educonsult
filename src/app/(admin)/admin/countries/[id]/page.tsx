import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/session";
import { getCountry } from "@/server/cms/admin-country.service";
import { CountryForm } from "@/components/admin/countries/country-form";

export const dynamic = "force-dynamic";

export default async function EditCountry({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("countries.write");
  const { id } = await params;
  const c = await getCountry(id);
  if (!c) notFound();
  const t = c.translations[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t?.name ?? c.slug}</h1>
        <p className="mt-1 text-sm text-muted-foreground font-mono">{c.code}</p>
      </div>
      <CountryForm mode="edit" id={c.id} initial={{
        code: c.code, slug: c.slug,
        flagUrl: c.flagUrl ?? "", imageUrl: c.imageUrl ?? "",
        avgTuitionUsd: c.avgTuitionUsd ?? "", visaSuccessRate: c.visaSuccessRate ?? "",
        popularity: c.popularity, isFeatured: c.isFeatured, status: c.status,
        name: t?.name ?? "", shortIntro: t?.shortIntro ?? "", description: t?.description ?? "",
      }} />
    </div>
  );
}
