import Link from "next/link";
import { FileText, Newspaper, Inbox, Quote, BookOpen, Globe2, ListChecks, Image } from "lucide-react";
import { getDashboardMetrics, getRecentActivity, getLeadsTimeseries } from "@/server/analytics/dashboard.service";
import { LeadsSparkline } from "@/components/admin/dashboard/leads-sparkline";

export const dynamic = "force-dynamic";

function MetricCard({
  href, icon: Icon, label, value, sub,
}: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; sub?: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      </div>
      <p className="mt-2 font-heading text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Link>
  );
}

export default async function AdminHome() {
  const [m, activity, timeseries] = await Promise.all([
    getDashboardMetrics(),
    getRecentActivity(6),
    getLeadsTimeseries(30),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">An overview of your site at a glance.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard href="/admin/leads" icon={Inbox} label="Leads (this month)" value={m.leads.thisMonth} sub={`${m.leads.openThisWeek} open this week`} />
        <MetricCard href="/admin/pages" icon={FileText} label="Pages" value={m.pages.total} sub={`${m.pages.published} live · ${m.pages.drafts} draft`} />
        <MetricCard href="/admin/blog" icon={Newspaper} label="Blog posts" value={m.blog.total} sub={`${m.blog.published} live · ${m.blog.drafts} draft`} />
        <MetricCard href="/admin/forms" icon={ListChecks} label="Forms" value={m.forms.total} />
        <MetricCard href="/admin/testimonials" icon={Quote} label="Testimonials" value={m.testimonials.total} />
        <MetricCard href="/admin/resources" icon={BookOpen} label="Resources" value={m.resources.total} />
        <MetricCard href="/admin/countries" icon={Globe2} label="Countries" value={m.countries.total} />
        <MetricCard href="/admin/media" icon={Image} label="Media" value={m.media.total} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Leads (last 30 days)
            </h2>
            <Link href="/admin/analytics" className="text-xs text-primary hover:underline">
              Full analytics →
            </Link>
          </div>
          <LeadsSparkline points={timeseries} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent leads
          </h2>
          <ul className="mt-3 space-y-2">
            {activity.leads.length === 0 ? (
              <li className="text-sm text-muted-foreground">No leads yet.</li>
            ) : (
              activity.leads.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="block rounded p-2 hover:bg-muted">
                    <p className="truncate text-sm font-medium">{l.fullName ?? l.email}</p>
                    <p className="text-xs text-muted-foreground">{l.source} · {l.status}</p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recently edited pages
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {activity.pages.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/pages/${p.id}/edit`} className="flex items-center justify-between py-2 hover:underline">
                  <span className="truncate text-sm">{p.title}</span>
                  <span className="text-xs text-muted-foreground">{p.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recently edited posts
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {activity.posts.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/blog/${p.id}/edit`} className="flex items-center justify-between py-2 hover:underline">
                  <span className="truncate text-sm">{p.title}</span>
                  <span className="text-xs text-muted-foreground">{p.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
