/**
 * Admin: lead analytics dashboard.
 *
 * Cards across the top, then breakdowns. Pure RSC — every aggregate comes
 * from `analyticsSummary()`. Date range is a query string (`?from=&to=`).
 */
import Link from "next/link";
import { analyticsSummary } from "@/server/leads/admin.service";
import { requirePermission } from "@/server/auth/session";
import { LEAD_STAGE_LABELS, LEAD_STATUS_COLORS } from "../_constants";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LeadAnalyticsPage({ searchParams }: PageProps) {
  await requirePermission("leads.read");
  const sp = await searchParams;
  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  const toParam = typeof sp.to === "string" ? sp.to : undefined;
  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  const data = await analyticsSummary({ from, to });
  const maxTimeline = Math.max(1, ...data.timeline.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/leads" className="text-xs text-muted-foreground hover:underline">
            ← Back to leads
          </Link>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Lead analytics</h1>
          <p className="text-sm text-muted-foreground">
            {data.range.from.toLocaleDateString()} → {data.range.to.toLocaleDateString()}
          </p>
        </div>
        <form action="/admin/leads/analytics" className="flex items-center gap-2">
          <input
            type="date"
            name="from"
            defaultValue={data.range.from.toISOString().slice(0, 10)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
          <input
            type="date"
            name="to"
            defaultValue={data.range.to.toISOString().slice(0, 10)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
          <button className="h-9 rounded-md border bg-background px-3 text-sm hover:bg-muted">Apply</button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total leads" value={data.total.toLocaleString()} />
        <KpiCard
          label="Won / Lost"
          value={`${data.won} / ${data.lost}`}
          hint={`${Math.round(data.conversionRate * 100)}% conversion`}
        />
        <KpiCard label="Avg score" value={Math.round(data.averageScore).toString()} />
        <KpiCard
          label="Action needed"
          value={`${data.overdueFollowUps + data.unassigned}`}
          hint={`${data.overdueFollowUps} overdue · ${data.unassigned} unassigned`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Daily volume">
          <div className="flex h-40 items-end gap-1">
            {data.timeline.map((t) => (
              <div key={t.day.toString()} className="flex-1" title={`${t.day.toString().slice(0, 10)}: ${t.count}`}>
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(t.count / maxTimeline) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Sources">
          <Bars rows={data.bySource} />
        </Panel>

        <Panel title="Status mix">
          <div className="space-y-2">
            {data.byStatus.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-sm">
                <span className={`rounded-full px-2 py-0.5 text-xs ${LEAD_STATUS_COLORS[s.key]}`}>{s.key}</span>
                <span className="font-mono">{s.count}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pipeline (stages)">
          <Bars
            rows={data.byStage.map((s) => ({ key: LEAD_STAGE_LABELS[s.key] ?? s.key, count: s.count }))}
          />
        </Panel>

        <Panel title="Temperature">
          <Bars rows={data.byTemperature} />
        </Panel>

        <Panel title="Top destinations">
          <Bars rows={data.byCountry} />
        </Panel>
      </div>
    </div>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Bars({ rows }: { rows: { key: string; count: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No data.</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.key} className="text-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-muted-foreground">{r.key}</span>
            <span className="font-mono">{r.count}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded bg-muted">
            <div className="h-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
