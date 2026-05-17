import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { listResources } from "@/server/cms/admin-resource.service";
import { Button } from "@/components/ui/atoms/button";
import { ResourceRowActions } from "@/components/admin/resources/resource-row-actions";

export const dynamic = "force-dynamic";

export default async function ResourcesAdmin() {
  await requirePermission("resources.read");
  const rows = await listResources();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">Downloadable guides, videos, templates.</p>
        </div>
        <Button asChild><Link href="/admin/resources/new"><Plus className="mr-1 h-4 w-4" /> New resource</Link></Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Gated</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No resources yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-medium">{r.translations[0]?.title ?? r.slug}</td>
                <td className="px-4 py-2 text-muted-foreground">/{r.slug}</td>
                <td className="px-4 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{r.type}</span></td>
                <td className="px-4 py-2 text-xs">{r.gated ? "✓" : "—"}</td>
                <td className="px-4 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{r.status}</span></td>
                <td className="px-4 py-2 text-right"><ResourceRowActions id={r.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
