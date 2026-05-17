import Link from "next/link";
import { Home } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { SortHeader } from "./sort-header";
import { RowActions } from "./row-actions";
import { StatusBadge } from "./status-badge";

interface PageRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  isHomepage: boolean;
  template: string | null;
  updatedAt: Date;
}

interface PagesTableProps {
  rows: PageRow[];
  sort: string;
  order: "asc" | "desc";
}

const RELATIVE_FMT = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(date: Date) {
  const diff = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return RELATIVE_FMT.format(Math.round(diff), "second");
  if (abs < 3600) return RELATIVE_FMT.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return RELATIVE_FMT.format(Math.round(diff / 3600), "hour");
  if (abs < 2592000) return RELATIVE_FMT.format(Math.round(diff / 86400), "day");
  return RELATIVE_FMT.format(Math.round(diff / 2592000), "month");
}

export function PagesTable({ rows, sort, order }: PagesTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">
              <SortHeader field="title" label="Title" currentSort={sort} currentOrder={order} />
            </th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Template</th>
            <th className="px-4 py-3 font-medium">
              <SortHeader field="status" label="Status" currentSort={sort} currentOrder={order} />
            </th>
            <th className="px-4 py-3 font-medium">
              <SortHeader field="updatedAt" label="Updated" currentSort={sort} currentOrder={order} />
            </th>
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const publicUrl = `${siteConfig.url}${p.isHomepage ? "/" : `/${p.slug}`}`;
            return (
              <tr key={p.id} className="border-t border-border transition hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-card-foreground">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/pages/${p.id}/edit`} className="hover:underline">
                      {p.title}
                    </Link>
                    {p.isHomepage ? (
                      <span title="Homepage" className="inline-flex items-center text-primary">
                        <Home className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/{p.slug}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.template ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(p.updatedAt)}</td>
                <td className="px-2 py-2 text-right">
                  <RowActions
                    pageId={p.id}
                    pageTitle={p.title}
                    publicUrl={publicUrl}
                    isHomepage={p.isHomepage}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
