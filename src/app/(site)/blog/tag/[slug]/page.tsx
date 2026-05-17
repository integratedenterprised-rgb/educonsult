/**
 * Tag landing — lighter than a category, no SEO record by default.
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
import { prisma } from "@/lib/prisma";
import { listBlogPosts } from "@/server/cms/blog.service";

export const revalidate = 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.tag.findFirst({ where: { slug, deletedAt: null } });
  if (!tag) return { title: "Not found" };
  return buildMetadata(
    {
      title: `#${tag.name} — Blog`,
      description: `Articles tagged ${tag.name}.`,
      canonicalPath: `/blog/tag/${tag.slug}`,
    },
    siteConfig.fallbackName,
  );
}

export default async function TagPage({ params, searchParams }: RouteParams) {
  const { slug } = await params;
  const sp = await searchParams;
  const pageNum = Number.parseInt(Array.isArray(sp.page) ? sp.page[0]! : sp.page ?? "1", 10);

  const tag = await prisma.tag.findFirst({ where: { slug, deletedAt: null } });
  if (!tag) notFound();

  const { rows, page, totalPages, total } = await listBlogPosts({
    tagSlug: slug,
    page: Number.isFinite(pageNum) ? pageNum : 1,
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: `#${tag.name}`, path: `/blog/tag/${tag.slug}` },
        ]}
        className="pt-6"
      />
      <JsonLd
        data={blogListingJsonLd({
          name: `#${tag.name}`,
          path: `/blog/tag/${tag.slug}`,
          posts: rows.map((r) => ({ slug: r.slug, title: r.title, publishedAt: r.publishedAt })),
        })}
      />
      <Container className="py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Tag</p>
          <h1 className="mt-1 font-heading text-4xl font-bold tracking-tight">#{tag.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {total} {total === 1 ? "post" : "posts"}
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
            No posts with this tag yet.
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
                href={`/blog/tag/${tag.slug}?page=${page - 1}`}
                className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
              >
                ← Previous
              </Link>
            ) : null}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/blog/tag/${tag.slug}?page=${page + 1}`}
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
