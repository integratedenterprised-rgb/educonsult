import Link from "next/link";
import { Plus } from "lucide-react";
import { listAdminPages, PAGE_SORT_FIELDS, type PageSortField } from "@/server/cms/admin-page.service";
import { Button } from "@/components/ui/atoms/button";
import { requirePermission } from "@/server/auth/session";
import { PagesFilters } from "./_components/pages-filters";
import { PagesTable } from "./_components/pages-table";
import { PagesPagination } from "./_components/pages-pagination";
import { EmptyState } from "./_components/empty-state";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AdminPagesIndex({ searchParams }: PageProps) {
  await requirePermission("pages.read");
  const sp = await searchParams;

  const query = firstParam(sp.q) ?? "";
  const status = firstParam(sp.status);
  const template = firstParam(sp.template);
  const isHomepageRaw = firstParam(sp.isHomepage);
  const sortRaw = firstParam(sp.sort) ?? "updatedAt";
  const orderRaw = firstParam(sp.order) ?? "desc";
  const pageNum = Number.parseInt(firstParam(sp.page) ?? "1", 10);

  const sort: PageSortField = PAGE_SORT_FIELDS.includes(sortRaw as PageSortField)
    ? (sortRaw as PageSortField)
    : "updatedAt";
  const order: "asc" | "desc" = orderRaw === "asc" ? "asc" : "desc";

  const { rows, total, totalPages, page, pageSize, templates } = await listAdminPages({
    query: query || undefined,
    status: status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED" ? status : undefined,
    template: template || undefined,
    isHomepage: isHomepageRaw === "true" ? true : isHomepageRaw === "false" ? false : undefined,
    sort,
    order,
    page: Number.isFinite(pageNum) ? pageNum : 1,
  });

  const hasFilters = Boolean(query || status || template || isHomepageRaw);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compose every public page from CMS blocks.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">
            <Plus className="mr-1 h-4 w-4" /> New page
          </Link>
        </Button>
      </div>

      <PagesFilters
        initialQuery={query}
        initialStatus={status ?? ""}
        initialTemplate={template ?? ""}
        initialHomepage={isHomepageRaw ?? ""}
        templates={templates}
      />

      {rows.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <PagesTable rows={rows} sort={sort} order={order} />
          <PagesPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
