import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { listSeoTargets } from "@/server/seo/admin-seo.service";

export const dynamic = "force-dynamic";

export default async function SeoIndex() {
  await requirePermission("seo.read");
  const { pages, posts, countries, resources } = await listSeoTargets();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">SEO manager</h1>
        <p className="mt-1 text-sm text-muted-foreground">Edit titles, descriptions, OG images, canonicals, and structured data.</p>
      </div>
      <Group title="Pages" rows={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status, hasSeo: !!p.seoId, kind: "page" }))} />
      <Group title="Blog posts" rows={posts.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status, hasSeo: !!p.seoId, kind: "post" }))} />
      <Group title="Countries" rows={countries.map((c) => ({ id: c.id, title: c.title, slug: c.slug, status: c.status, hasSeo: !!c.seoId, kind: "country" }))} />
      <Group title="Resources" rows={resources.map((r) => ({ id: r.id, title: r.title, slug: r.slug, status: r.status, hasSeo: !!r.seoId, kind: "resource" }))} />
    </div>
  );
}

function Group({ title, rows }: { title: string; rows: { id: string; title: string; slug: string; status: string; hasSeo: boolean; kind: string }[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">SEO</th>
              <th className="px-4 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={`${r.kind}-${r.id}`}>
                <td className="px-4 py-2 font-medium">{r.title}</td>
                <td className="px-4 py-2 text-muted-foreground">/{r.slug}</td>
                <td className="px-4 py-2 text-xs"><span className="rounded bg-muted px-2 py-0.5">{r.status}</span></td>
                <td className="px-4 py-2 text-xs">{r.hasSeo ? "✓ Set" : "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/seo/${r.kind}/${r.id}`} className="text-primary hover:underline">Edit SEO</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
