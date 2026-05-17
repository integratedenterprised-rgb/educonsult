import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/session";
import { getTestimonial } from "@/server/cms/admin-testimonial.service";
import { prisma } from "@/lib/prisma";
import { TestimonialForm } from "@/components/admin/testimonials/testimonial-form";

export const dynamic = "force-dynamic";

export default async function EditTestimonial({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("testimonials.write");
  const { id } = await params;
  const [t, countries] = await Promise.all([
    getTestimonial(id),
    prisma.country.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true, translations: { where: { locale: "EN" }, take: 1, select: { name: true } } },
      orderBy: { code: "asc" },
    }),
  ]);
  if (!t) notFound();
  const tr = t.translations[0];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{t.studentName}</h1>
      <TestimonialForm
        mode="edit" id={t.id}
        countries={countries.map((c) => ({ id: c.id, label: `${c.code} — ${c.translations[0]?.name ?? ""}` }))}
        initial={{
          studentName: t.studentName,
          studentPhotoUrl: t.studentPhotoUrl ?? "",
          universityName: t.universityName ?? "",
          programName: t.programName ?? "",
          intakeYear: t.intakeYear ?? "",
          rating: t.rating ?? "",
          isFeatured: t.isFeatured,
          countryId: t.countryId ?? "",
          status: t.status,
          quote: tr?.quote ?? "",
          studentTitle: tr?.studentTitle ?? "",
        }}
      />
    </div>
  );
}
