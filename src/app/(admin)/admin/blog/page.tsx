/**
 * Admin: blog post list.
 */
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { listAdminPosts, BLOG_SORT_FIELDS, type BlogSortField } from "@/server/cms/admin-blog.service";
import { requirePermission } from "@/server/auth/session";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-amber-100 text-amber-900",
  PUBLISHED: "bg-emerald-100 text-emerald-900",
  ARCHIVED: "bg-zinc-200 text-zinc-700",
};

export default async function AdminBlogIndex({ searchParams }: PageProps) {
  await requirePermission("blog.read");
  const sp = await searchParams;
  const query = first(sp.q) ?? "";
  const status = first(sp.status);
  const sortRaw = first(sp.sort) ?? "updatedAt";
  const sort: BlogSortField = BLOG_SORT_FIELDS.includes(sortRaw as BlogSortField)
    ? (sortRaw as BlogSortField)
    : "updatedAt";
  const pageNum = Number.parseInt(first(sp.page) ?? "1", 10);

  const { rows, page, totalPages, total } = await listAdminPosts({
    query: query || undefined,
    status: status === "DRAFT" || status === "SCHEDULED" || status === "PUBLISHED" || status === "ARCHIVED" ? status : undefined,
    sort,
    page: Number.isFinite(pageNum) ? pageNum : 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage posts, categories, tags, and authors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/blog/categories">Categories</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/blog/tags">Tags</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/blog/authors">Authors</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus className="mr-1 h-4 w-4" /> New post
            </Link>
          </Button>
        </div>
      </div>

      <form className="flex flex-wrap gap-3" action="/admin/blog">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by title or slug…"
          className="flex h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="">Any status</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          No posts yet. <Link href="/admin/blog/new" className="text-primary underline">Create the first one</Link>.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((post) => {
                const author = post.author?.translations.find((t) => t.locale === "EN") ?? post.author?.translations[0];
                return (
                  <tr key={post.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">/{post.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{author?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {post.categories.map((c) => c.category.slug).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          STATUS_COLORS[post.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {post.updatedAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} · {total} posts
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={{ pathname: "/admin/blog", query: { ...sp, page: page - 1 } }}
                className="rounded-md border border-border bg-card px-3 py-1.5 hover:bg-muted"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={{ pathname: "/admin/blog", query: { ...sp, page: page + 1 } }}
                className="rounded-md border border-border bg-card px-3 py-1.5 hover:bg-muted"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
