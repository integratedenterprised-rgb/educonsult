import Link from "next/link";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import { SectionType } from "@prisma/client";

export const dynamic = "force-dynamic";

const SECTION_TYPES = new Set<string>(Object.values(SectionType));

export default async function SectionsAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("pages.read");
  const sp = await searchParams;
  const rawType = typeof sp.type === "string" ? sp.type : "";
  const type = SECTION_TYPES.has(rawType) ? (rawType as SectionType) : "";

  const sections = await prisma.section.findMany({
    where: {
      deletedAt: null,
      ...(type ? { type } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { page: { select: { id: true, slug: true, title: true } } },
  });

  const types = await prisma.section.groupBy({ by: ["type"], _count: { _all: true } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Sections</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inspect every section across the site. Edit happens inside each page.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/sections" className={`rounded-full border px-3 py-1 text-xs ${!type ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
          All ({sections.length})
        </Link>
        {types.map((t) => (
          <Link key={t.type} href={`/admin/sections?type=${t.type}`}
                className={`rounded-full border px-3 py-1 text-xs ${type === t.type ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {t.type} ({t._count._all})
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Anchor</th>
              <th className="px-4 py-2">Page</th>
              <th className="px-4 py-2">Visible</th>
              <th className="px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sections.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No sections.</td></tr>
            ) : sections.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{s.type}</span></td>
                <td className="px-4 py-2 font-mono text-xs">{s.anchor ?? "—"}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/pages/${s.page.id}/edit`} className="text-primary hover:underline">{s.page.title}</Link>
                  <span className="text-muted-foreground"> /{s.page.slug}</span>
                </td>
                <td className="px-4 py-2 text-xs">{s.isVisible ? "✓" : "—"}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(s.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
