/**
 * Admin: lead list.
 *
 * Server-rendered table backed by `listLeads`. The filter row is plain
 * HTML <form> so it's keyboard-friendly and bookmark-friendly. The CSV
 * "Export" button posts the same query string to the export endpoint.
 *
 * A small client island (`./lead-row-actions.tsx`) handles assign / stage
 * change without leaving the page.
 */
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Badge } from "@/components/ui/atoms/badge";
import { listLeads } from "@/server/leads/admin.service";
import { listTags } from "@/server/leads/admin.service";
import { leadListQuerySchema } from "@/lib/validators/lead";
import { requirePermission } from "@/server/auth/session";
import { LEAD_STAGE_LABELS, LEAD_STATUS_COLORS, LEAD_TEMP_COLORS } from "./_constants";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadsListPage({ searchParams }: PageProps) {
  await requirePermission("leads.read");
  const sp = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const f = first(v);
    if (f !== undefined && f !== "") flat[k] = f;
  }
  const parsed = leadListQuerySchema.safeParse(flat);
  const params = parsed.success ? parsed.data : {};

  const [{ rows, total, page, pageSize, pageCount }, tags] = await Promise.all([
    listLeads(params),
    listTags(),
  ]);

  const qs = new URLSearchParams(flat).toString();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString()} total · filter, search, assign, and export.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/leads/analytics">Analytics</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/leads/tags">Tags</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/admin/leads/export?${qs}`}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </a>
          </Button>
          <Button asChild>
            <Link href="/admin/leads/new">
              <Plus className="mr-1 h-4 w-4" /> New lead
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <form action="/admin/leads" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          name="query"
          defaultValue={flat.query ?? ""}
          placeholder="Search name, email, phone…"
          className="col-span-2 h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select name="source" defaultValue={flat.source ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Any source</option>
          {[
            "ELIGIBILITY_FORM",
            "VISA_RISK_FORM",
            "CONSULTATION_FORM",
            "RESOURCE_DOWNLOAD",
            "CONTACT_FORM",
            "CHAT_WIDGET",
            "PHONE_CALL",
            "WALK_IN",
            "REFERRAL",
            "EVENT",
            "MANUAL_ENTRY",
            "IMPORT",
            "OTHER",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ").toLowerCase()}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={flat.status ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Any status</option>
          {["NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "WON", "LOST"].map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </select>
        <select name="stage" defaultValue={flat.stage ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Any stage</option>
          {Object.entries(LEAD_STAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="temperature" defaultValue={flat.temperature ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Any temp</option>
          <option value="HOT">Hot</option>
          <option value="WARM">Warm</option>
          <option value="COLD">Cold</option>
        </select>
        <select name="tagId" defaultValue={flat.tagId ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">Any tag</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" name="unassigned" value="true" defaultChecked={flat.unassigned === "true"} /> Unassigned
        </label>
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" name="overdueFollowUp" value="true" defaultChecked={flat.overdueFollowUp === "true"} /> Overdue
        </label>
        <input
          type="date"
          name="createdFrom"
          defaultValue={flat.createdFrom ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <input
          type="date"
          name="createdTo"
          defaultValue={flat.createdTo ?? ""}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <div className="col-span-full flex items-center gap-2">
          <Button type="submit">Apply</Button>
          <Button asChild variant="ghost" type="button">
            <Link href="/admin/leads">Reset</Link>
          </Button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Lead</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Score</th>
              <th className="px-3 py-2">Assignee</th>
              <th className="px-3 py-2">Tags</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Next follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-muted-foreground">
                  No leads match this filter.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={`/admin/leads/${r.id}`} className="font-medium text-foreground hover:underline">
                    {r.fullName ?? "(no name)"}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {r.email ?? "—"} · {r.phone ?? "—"}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">{r.source.replace(/_/g, " ").toLowerCase()}</td>
                <td className="px-3 py-2 text-xs">{LEAD_STAGE_LABELS[r.stage] ?? r.stage}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${LEAD_STATUS_COLORS[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${LEAD_TEMP_COLORS[r.temperature]}`}>
                    {r.score}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">{r.assignedTo?.name ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map(({ tag }) => (
                      <Badge key={tag.id} variant="secondary" style={tag.color ? { backgroundColor: tag.color + "22", color: tag.color } : undefined}>
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {r.nextFollowUpAt ? new Date(r.nextFollowUpAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pageCount} · {pageSize} per page
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link className="rounded-md border px-3 py-1 hover:bg-muted" href={`/admin/leads?${updateQs(qs, "page", String(page - 1))}`}>
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link className="rounded-md border px-3 py-1 hover:bg-muted" href={`/admin/leads?${updateQs(qs, "page", String(page + 1))}`}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function updateQs(qs: string, key: string, value: string): string {
  const p = new URLSearchParams(qs);
  p.set(key, value);
  return p.toString();
}
