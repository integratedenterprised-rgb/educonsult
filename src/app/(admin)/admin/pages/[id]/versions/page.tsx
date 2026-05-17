import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("pages.read");
  const { id } = await params;
  const [page, versions] = await Promise.all([
    prisma.page.findFirst({ where: { id, deletedAt: null }, select: { id: true, title: true, slug: true } }),
    prisma.pageVersion.findMany({
      where: { pageId: id },
      orderBy: { version: "desc" },
      include: { createdBy: { select: { name: true, email: true } } },
    }),
  ]);
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/pages/${id}/edit`} className="text-xs text-muted-foreground hover:text-foreground">← Back to editor</Link>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">{page.title} — versions</h1>
        <p className="text-sm text-muted-foreground">/{page.slug}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-2">Version</th><th className="px-4 py-2">Saved at</th><th className="px-4 py-2">By</th><th className="px-4 py-2">Note</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {versions.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No prior versions yet — saves from here on will be recorded.</td></tr>
            ) : versions.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-2 font-mono text-xs">v{v.version}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs">{v.createdBy?.name ?? "—"}</td>
                <td className="px-4 py-2 text-xs">{v.changeNote ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
