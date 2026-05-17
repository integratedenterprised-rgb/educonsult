import Link from "next/link";
import { Plus, Copy } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { listComponents } from "@/server/cms/admin-component.service";
import { Button } from "@/components/ui/atoms/button";
import { ComponentRowActions } from "@/components/admin/components/component-row-actions";

export const dynamic = "force-dynamic";

export default async function ComponentsAdmin() {
  await requirePermission("components.read");
  const rows = await listComponents();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Components</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reusable blocks an editor can drop into any page.</p>
        </div>
        <Button asChild><Link href="/admin/components/new"><Plus className="mr-1 h-4 w-4" /> New component</Link></Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Key</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Used in</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No components yet.</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{c.key}</td>
                <td className="px-4 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{c.type}</span></td>
                <td className="px-4 py-2 text-xs">{c._count.sections} section{c._count.sections === 1 ? "" : "s"}</td>
                <td className="px-4 py-2 text-right"><ComponentRowActions id={c.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
