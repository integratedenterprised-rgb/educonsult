import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { computeFunnel, listFunnels } from "@/server/analytics/funnel.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function FunnelsPage() {
  await requirePermission("analytics.read");
  const funnels = await listFunnels();
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 86_400_000);
  const results = await Promise.all(funnels.map((f) => computeFunnel(f, { rangeStart: start, rangeEnd: end })));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Funnels</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Multi-step conversion paths — last 30 days.{" "}
          <Link href="/admin/analytics" className="underline">
            Back to overview
          </Link>
        </p>
      </header>

      {results.length === 0 && (
        <p className="text-sm text-muted-foreground">No funnels defined. Seed the defaults via `prisma seed` or define one via the API.</p>
      )}

      <div className="space-y-6">
        {results.map((r) => (
          <article key={r.funnelId} className="rounded-xl border border-border bg-card p-5">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-semibold">{r.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Window: {r.windowHours}h · Entrants: {r.totalEntrants} · Overall conversion:{" "}
                  {(r.overallConversion * 100).toFixed(1)}%
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs uppercase tracking-wider text-muted-foreground">
                {r.slug}
              </span>
            </header>
            <ol className="mt-5 space-y-3">
              {r.steps.map((s, i) => {
                const pct = Math.round(s.conversion * 100);
                const stepPct = Math.round(s.stepConversion * 100);
                return (
                  <li key={s.step} className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">
                        {i + 1}. {s.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {s.entrants.toLocaleString()} ({pct}% overall · {stepPct}% step)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(pct, 0.5)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}
