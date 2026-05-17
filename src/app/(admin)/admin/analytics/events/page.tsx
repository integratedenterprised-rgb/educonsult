import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; path?: string }>;
}) {
  await requirePermission("analytics.read");
  const { type, path } = await searchParams;

  const events = await prisma.analyticsEvent.findMany({
    where: {
      ...(type ? { type: type as never } : {}),
      ...(path ? { path } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Raw events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last 200 first-party events.{" "}
          <Link href="/admin/analytics" className="underline">
            Back to overview
          </Link>
        </p>
      </header>

      <form className="flex flex-wrap gap-2 text-sm">
        <input
          name="type"
          defaultValue={type}
          placeholder="Filter by type (e.g. CTA_CLICK)"
          className="rounded-md border border-border bg-background px-3 py-1.5"
        />
        <input
          name="path"
          defaultValue={path}
          placeholder="Filter by path"
          className="rounded-md border border-border bg-background px-3 py-1.5"
        />
        <button type="submit" className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground">
          Filter
        </button>
      </form>

      <section className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="p-3 text-left font-medium">When</th>
              <th className="p-3 text-left font-medium">Type</th>
              <th className="p-3 text-left font-medium">Path</th>
              <th className="p-3 text-left font-medium">Visitor</th>
              <th className="p-3 text-left font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-5 text-center text-muted-foreground">
                  No events match.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="border-t border-border/60 align-top">
                  <td className="p-3 text-muted-foreground">{e.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                  <td className="p-3 font-medium">{e.type}</td>
                  <td className="p-3 text-muted-foreground">{e.path}</td>
                  <td className="p-3 text-muted-foreground">{e.anonId.slice(0, 12)}…</td>
                  <td className="p-3">
                    {e.ctaId && <div>cta: {e.ctaLabel ?? e.ctaId}</div>}
                    {e.formId && <div>form: {e.formId}</div>}
                    {e.fieldName && <div>field: {e.fieldName}</div>}
                    {e.errorMessage && <div className="text-red-600">err: {e.errorMessage}</div>}
                    {e.value != null && <div>value: {e.value}</div>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
