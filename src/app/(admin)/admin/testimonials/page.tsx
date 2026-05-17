import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { listTestimonials } from "@/server/cms/admin-testimonial.service";
import { Button } from "@/components/ui/atoms/button";
import { TestimonialRowActions } from "@/components/admin/testimonials/testimonial-row-actions";

export const dynamic = "force-dynamic";

export default async function TestimonialsAdmin() {
  await requirePermission("testimonials.read");
  const rows = await listTestimonials();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Testimonials</h1>
          <p className="mt-1 text-sm text-muted-foreground">Student stories.</p>
        </div>
        <Button asChild><Link href="/admin/testimonials/new"><Plus className="mr-1 h-4 w-4" /> New testimonial</Link></Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No testimonials yet.
          </div>
        ) : rows.map((t) => (
          <Link key={t.id} href={`/admin/testimonials/${t.id}`} className="block rounded-xl border border-border bg-card p-4 hover:border-primary">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{t.studentName}</p>
                <p className="text-xs text-muted-foreground">{t.universityName ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-muted px-2 py-0.5 text-xs">{t.status}</span>
                <TestimonialRowActions id={t.id} />
              </div>
            </div>
            {typeof t.rating === "number" && (
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
              </div>
            )}
            <p className="mt-2 line-clamp-3 text-sm">{t.translations[0]?.quote ?? "—"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
