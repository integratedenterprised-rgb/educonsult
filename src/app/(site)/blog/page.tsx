/**
 * Blog index — paginated list of all published posts.
 *
 * SEO: canonical metadata + ItemList JSON-LD on every page.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PostCard } from "@/components/blog/post-card";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";
import { listBlogPosts, listCategories } from "@/server/cms/blog.service";
import { blogListingJsonLd } from "@/lib/blog";

export const revalidate = 60;

const PAGE_TITLE = "Blog";
const PAGE_DESCRIPTION =
  "Insights, application guides, and student stories from across our destinations.";

export const metadata: Metadata = buildMetadata(
  {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    canonicalPath: "/blog",
  },
  siteConfig.fallbackName,
);

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BlogIndex({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageNum = Number.parseInt(first(sp.page) ?? "1", 10);
  const query = first(sp.q) ?? "";

  const [{ rows, total, page, totalPages }, allCategories] = await Promise.all([
    listBlogPosts({ page: Number.isFinite(pageNum) ? pageNum : 1, query: query || undefined }),
    listCategories(),
  ]);

  return (
    <>
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} className="pt-6" />
      <JsonLd
        data={blogListingJsonLd({
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          path: "/blog",
          posts: rows.map((r) => ({ slug: r.slug, title: r.title, publishedAt: r.publishedAt })),
        })}
      />
      <Container className="py-10">
        <header className="mb-8">
          <h1 className="font-heading text-4xl font-bold tracking-tight">{PAGE_TITLE}</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{PAGE_DESCRIPTION}</p>
        </header>

        {allCategories.length > 0 ? (
          <nav aria-label="Categories" className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
            >
              All
            </Link>
            {allCategories.map((c) => (
              <Link
                key={c.id}
                href={`/blog/category/${c.slug}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
              >
                {c.name} <span className="text-muted-foreground">({c.postCount})</span>
              </Link>
            ))}
          </nav>
        ) : null}

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
            No posts published yet.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {rows.map((post, i) => (
              <PostCard key={post.id} post={post} featured={i === 0 && page === 1} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link
                href={`/blog?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
              >
                ← Previous
              </Link>
            ) : null}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {total} {total === 1 ? "post" : "posts"}
            </span>
            {page < totalPages ? (
              <Link
                href={`/blog?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
              >
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </Container>
    </>
  );
}
