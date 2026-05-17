import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { listForms } from "@/server/cms/admin-form.service";
import { Button } from "@/components/ui/atoms/button";

export const dynamic = "force-dynamic";

export default async function FormsAdmin() {
  await requirePermission("forms.read");
  const forms = await listForms();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="mt-1 text-sm text-muted-foreground">Dynamic lead-capture forms with conditional logic.</p>
        </div>
        <Button asChild><Link href="/admin/forms/new"><Plus className="mr-1 h-4 w-4" /> New form</Link></Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Heading</th>
              <th className="px-4 py-2">Key</th>
              <th className="px-4 py-2">Fields</th>
              <th className="px-4 py-2">Submissions</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {forms.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No forms yet.</td></tr>
            ) : forms.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-2 font-medium">{f.translations[0]?.heading ?? f.key}</td>
                <td className="px-4 py-2 font-mono text-xs">{f.key}</td>
                <td className="px-4 py-2 text-xs">{f._count.fields}</td>
                <td className="px-4 py-2 text-xs">{f._count.submissions}</td>
                <td className="px-4 py-2 text-xs"><span className={f.isActive ? "text-emerald-700" : "text-muted-foreground"}>{f.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-2 text-right"><Link href={`/admin/forms/${f.id}`} className="text-primary hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
