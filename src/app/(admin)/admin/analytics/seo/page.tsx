import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { seoOverview, seoTimeseries, topPages, topQueries } from "@/server/analytics/seo.service";
import { SeoImportForm } from "@/components/admin/analytics/seo-import-form";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SeoAnalyticsPage() {
  await requirePermission("analytics.read");
  const days = 28;
  const [overview, timeseries, pages, queries] = await Promise.all([
    seoOverview(days),
    seoTimeseries(days),
    topPages(days),
    topQueries(days),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">SEO performance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Last {days} days · last sync {overview.lastSyncAt ? overview.lastSyncAt.toLocaleString() : "never"} ·{" "}
            <Link href="/admin/analytics" className="underline">
              Back to overview
            </Link>
          </p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clicks" value={overview.clicks.toLocaleString()} delta={overview.clicksDeltaPct} />
        <Stat
          label="Impressions"
          value={overview.impressions.toLocaleString()}
          delta={overview.impressionsDeltaPct}
        />
        <Stat label="CTR" value={`${(overview.ctr * 100).toFixed(2)}%`} />
        <Stat label="Avg. position" value={overview.avgPosition.toFixed(1)} />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Daily clicks & impressions
        </h2>
        <DualBars points={timeseries} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Block title="Top pages">
          <Table
            head={["Path", "Clicks", "Impr.", "CTR", "Pos."]}
            rows={pages.map((p) => [
              p.path,
              p.clicks.toLocaleString(),
              p.impressions.toLocaleString(),
              `${(p.ctr * 100).toFixed(1)}%`,
              p.avgPosition.toFixed(1),
            ])}
          />
        </Block>
        <Block title="Top queries">
          <Table
            head={["Query", "Clicks", "Impr.", "CTR", "Pos."]}
            rows={queries.map((q) => [
              q.query,
              q.clicks.toLocaleString(),
              q.impressions.toLocaleString(),
              `${(q.ctr * 100).toFixed(1)}%`,
              q.avgPosition.toFixed(1),
            ])}
          />
        </Block>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Import Google Search Console data
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload the GSC export CSV (date, query, page, clicks, impressions, ctr, position). Re-importing the
          same day overwrites — safe to run nightly.
        </p>
        <div className="mt-4">
          <SeoImportForm />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
      {typeof delta === "number" && Number.isFinite(delta) && (
        <p className={`mt-0.5 text-xs ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {delta >= 0 ? "+" : ""}
          {(delta * 100).toFixed(1)}% vs prior
        </p>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No data.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-muted-foreground">
            {head.map((h, i) => (
              <th key={h} className={`py-2 font-medium ${i === 0 ? "text-left" : "text-right"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/60">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={`py-2 ${j === 0 ? "text-left" : "text-right tabular-nums"} ${j === 0 ? "max-w-xs truncate" : ""}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DualBars({ points }: { points: { date: string; clicks: number; impressions: number }[] }) {
  if (points.length === 0) return <p className="mt-3 text-sm text-muted-foreground">No data.</p>;
  const maxC = Math.max(1, ...points.map((p) => p.clicks));
  const maxI = Math.max(1, ...points.map((p) => p.impressions));
  return (
    <div className="mt-4 flex h-32 items-end gap-1">
      {points.map((p) => (
        <div key={p.date} className="flex flex-1 flex-col items-stretch justify-end gap-0.5">
          <div
            className="rounded-sm bg-muted-foreground/40"
            style={{ height: `${(p.impressions / maxI) * 100}%` }}
            title={`${p.date}: ${p.impressions.toLocaleString()} impressions`}
          />
          <div
            className="rounded-sm bg-primary"
            style={{ height: `${(p.clicks / maxC) * 100}%` }}
            title={`${p.date}: ${p.clicks.toLocaleString()} clicks`}
          />
        </div>
      ))}
    </div>
  );
}
