/**
 * Category landing page — all posts in one category, paginated.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PostCard } from "@/components/blog/post-card";
import { buildMetadata } from "@/lib/seo";
import { blogListingJsonLd } from "@/lib/blog";
import { siteConfig } from "@/lib/config";
import { getCategoryBySlug, listBlogPosts } from "@/server/cms/blog.service";

export const revalidate = 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Not found" };
  return buildMetadata(
    {
      title: category.seo.title ?? `${category.name} — Blog`,
      description: category.seo.description ?? category.description,
      keywords: category.seo.keywords,
      ogImageUrl: category.seo.ogImageUrl,
      canonicalPath: `/blog/category/${category.slug}`,
    },
    siteConfig.fallbackName,
  );
}

export default async function CategoryPage({ params, searchParams }: RouteParams) {
  const { slug } = await params;
  const sp = await searchParams;
  const pageNum = Number.parseInt(Array.isArray(sp.page) ? sp.page[0]! : sp.page ?? "1", 10);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { rows, page, totalPages, total } = await listBlogPosts({
    categorySlug: slug,
    page: Number.isFinite(pageNum) ? pageNum : 1,
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: category.name, path: `/blog/category/${category.slug}` },
        ]}
        className="pt-6"
      />
      <JsonLd
        data={blogListingJsonLd({
          name: category.name,
          description: category.description,
          path: `/blog/category/${category.slug}`,
          posts: rows.map((r) => ({ slug: r.slug, title: r.title, publishedAt: r.publishedAt })),
        })}
      />
      <Container className="py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Category</p>
          <h1 className="mt-1 font-heading text-4xl font-bold tracking-tight">{category.name}</h1>
          {category.description ? (
            <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{category.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            {category.postCount} {category.postCount === 1 ? "post" : "posts"}
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
            No posts in this category yet.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {rows.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link
                href={`/blog/category/${category.slug}?page=${page - 1}`}
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
                href={`/blog/category/${category.slug}?page=${page + 1}`}
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
