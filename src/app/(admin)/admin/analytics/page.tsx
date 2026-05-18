import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { LeadsSparkline } from "@/components/admin/dashboard/leads-sparkline";
import {
  getConversionMetrics,
  getCountryInterest,
  getFormCompletion,
  getLeadSources,
  getLeadsTimeseries,
  getTrafficSources,
} from "@/server/analytics/dashboard.service";
import { seoOverview } from "@/server/analytics/seo.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AnalyticsOverviewPage() {
  await requirePermission("analytics.read");

  const [conversion, sources, countries, forms, traffic, timeseries, seo] = await Promise.all([
    getConversionMetrics(90),
    getLeadSources(90),
    getCountryInterest(90),
    getFormCompletion(90),
    getTrafficSources(30),
    getLeadsTimeseries(90),
    seoOverview(28),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lead, traffic, and SEO performance — last 90 days unless noted.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <SubNav href="/admin/analytics" label="Overview" active />
          <SubNav href="/admin/analytics/funnels" label="Funnels" />
          <SubNav href="/admin/analytics/seo" label="SEO" />
          <SubNav href="/admin/analytics/ctas" label="CTAs" />
          <SubNav href="/admin/analytics/events" label="Events" />
          <SubNav href="/admin/analytics/config" label="Config" />
        </nav>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Sessions → Lead"
          value={fmtPct(conversion.sessionToLeadRate)}
          sub={`${conversion.uniqueConverters} / ${conversion.sessions}`}
        />
        <Stat
          label="Win rate"
          value={fmtPct(conversion.winRate)}
          sub={`${conversion.won} won · ${conversion.lost} lost`}
        />
        <Stat label="Leads (90d)" value={String(conversion.leads)} sub="all sources" />
        <Stat
          label="SEO clicks (28d)"
          value={String(seo.clicks)}
          sub={`${seo.impressions.toLocaleString()} impressions · ${fmtDelta(seo.clicksDeltaPct)}`}
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Leads (last 90 days)
        </h2>
        <LeadsSparkline points={timeseries} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Block title="Lead sources">
          <Table
            head={["Source", "Leads", "Won", "Conv."]}
            rows={sources.map((s) => [
              prettySource(s.source),
              String(s.count),
              String(s.won),
              fmtPct(s.conversion),
            ])}
          />
        </Block>
        <Block title="Traffic sources (UTM)">
          <Table
            head={["Source", "Sessions", "Leads", "Conv."]}
            rows={traffic.map((t) => [t.source, String(t.sessions), String(t.leads), fmtPct(t.conversion)])}
          />
        </Block>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Block title="Country interest" subtitle="destination country the lead asked about">
          <Table
            head={["Country", "Leads", "Visitors", "Conv."]}
            rows={countries.map((c) => [
              c.countryName ?? c.countryCode,
              String(c.leads),
              String(c.visitors),
              fmtPct(c.conversion),
            ])}
          />
        </Block>
        <Block title="Form completion">
          <Table
            head={["Form", "View → Start", "Start → Submit", "Errors"]}
            rows={forms.map((f) => [
              f.formKey,
              `${fmtPct(f.startRate)} (${f.starts}/${f.views})`,
              `${fmtPct(f.completionRate)} (${f.submits}/${f.starts})`,
              `${fmtPct(f.errorRate)}`,
            ])}
          />
        </Block>
      </section>
    </div>
  );
}

function SubNav({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href as never}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Block({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No data.</p>;
  return (
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
              <td key={j} className={`py-2 ${j === 0 ? "text-left" : "text-right tabular-nums"}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function fmtPct(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(v < 0.01 ? 2 : 1)}%`;
}

function fmtDelta(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(1)}% vs prior`;
}

function prettySource(s: string): string {
  return s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
