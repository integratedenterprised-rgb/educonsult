import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { listCountries } from "@/server/cms/admin-country.service";
import { Button } from "@/components/ui/atoms/button";
import { CountryRowActions } from "@/components/admin/countries/country-row-actions";

export const dynamic = "force-dynamic";

export default async function CountriesAdmin() {
  await requirePermission("countries.read");
  const rows = await listCountries();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Countries</h1>
          <p className="mt-1 text-sm text-muted-foreground">Destinations promoted on the site.</p>
        </div>
        <Button asChild>
          <Link href="/admin/countries/new"><Plus className="mr-1 h-4 w-4" /> New country</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Featured</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No countries yet.</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 font-mono">{c.code}</td>
                <td className="px-4 py-2 font-medium">{c.translations[0]?.name ?? c.slug}</td>
                <td className="px-4 py-2 text-muted-foreground">/{c.slug}</td>
                <td className="px-4 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{c.status}</span></td>
                <td className="px-4 py-2 text-xs">{c.isFeatured ? "★" : "—"}</td>
                <td className="px-4 py-2 text-right"><CountryRowActions id={c.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
