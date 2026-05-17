import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { topCtas } from "@/server/analytics/cta.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CtasPage() {
  await requirePermission("analytics.read");
  const rows = await topCtas(30, 30);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">CTA performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clicks per CTA — last 30 days.{" "}
          <Link href="/admin/analytics" className="underline">
            Back to overview
          </Link>
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No CTA clicks recorded yet. Wrap your buttons with{" "}
            <code className="rounded bg-muted px-1 py-0.5">&lt;CtaButton&gt;</code> and pass a stable{" "}
            <code className="rounded bg-muted px-1 py-0.5">ctaId</code>.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 text-left font-medium">CTA</th>
                <th className="p-4 text-left font-medium">Top page</th>
                <th className="p-4 text-right font-medium">Clicks</th>
                <th className="p-4 text-right font-medium">Unique visitors</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ctaId} className="border-t border-border/60">
                  <td className="p-4">
                    <div className="font-medium">{r.ctaLabel}</div>
                    <div className="text-xs text-muted-foreground">{r.ctaId}</div>
                    {r.ctaHref && (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">→ {r.ctaHref}</div>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{r.topPath ?? "—"}</td>
                  <td className="p-4 text-right tabular-nums">{r.clicks.toLocaleString()}</td>
                  <td className="p-4 text-right tabular-nums">{r.uniqueVisitors.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
