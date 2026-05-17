import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import { TestimonialForm } from "@/components/admin/testimonials/testimonial-form";

export const dynamic = "force-dynamic";

export default async function NewTestimonial() {
  await requirePermission("testimonials.write");
  const countries = await prisma.country.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, translations: { where: { locale: "EN" }, take: 1, select: { name: true } } },
    orderBy: { code: "asc" },
  });
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New testimonial</h1>
      </div>
      <TestimonialForm mode="create" countries={countries.map((c) => ({ id: c.id, label: `${c.code} — ${c.translations[0]?.name ?? ""}` }))} />
    </div>
  );
}
