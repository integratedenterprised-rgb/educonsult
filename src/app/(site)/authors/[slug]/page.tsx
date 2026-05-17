/**
 * Author profile page — header card + their published posts, paginated.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { AuthorCard } from "@/components/blog/author-card";
import { PostCard } from "@/components/blog/post-card";
import { buildMetadata } from "@/lib/seo";
import { blogListingJsonLd } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/config";
import { getAuthorBySlug, listBlogPosts } from "@/server/cms/blog.service";

export const revalidate = 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: "Not found" };
  return buildMetadata(
    {
      title: `${author.name}${author.title ? ` — ${author.title}` : ""}`,
      description: author.bio ?? `Articles by ${author.name}.`,
      canonicalPath: `/authors/${author.slug}`,
      ogImageUrl: author.avatarUrl,
    },
    siteConfig.fallbackName,
  );
}

export default async function AuthorPage({ params, searchParams }: RouteParams) {
  const { slug } = await params;
  const sp = await searchParams;
  const pageNum = Number.parseInt(Array.isArray(sp.page) ? sp.page[0]! : sp.page ?? "1", 10);

  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const { rows, page, totalPages, total } = await listBlogPosts({
    authorSlug: slug,
    page: Number.isFinite(pageNum) ? pageNum : 1,
  });

  const personLd = {
    "@context": "https://schema.org" as const,
    "@type": "Person" as const,
    name: author.name,
    jobTitle: author.title ?? undefined,
    description: author.bio ?? undefined,
    image: author.avatarUrl ?? undefined,
    url: absoluteUrl(`/authors/${author.slug}`),
    sameAs: [
      author.twitter ? `https://twitter.com/${author.twitter.replace(/^@/, "")}` : null,
      author.linkedin,
    ].filter((s): s is string => Boolean(s)),
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Authors", path: "/authors" },
          { name: author.name, path: `/authors/${author.slug}` },
        ]}
        className="pt-6"
      />
      <JsonLd
        data={[
          personLd,
          blogListingJsonLd({
            name: `${author.name} — Posts`,
            path: `/authors/${author.slug}`,
            posts: rows.map((r) => ({ slug: r.slug, title: r.title, publishedAt: r.publishedAt })),
          }),
        ]}
      />
      <Container className="py-10">
        <AuthorCard
          slug={author.slug}
          name={author.name}
          title={author.title}
          bio={author.bio}
          avatarUrl={author.avatarUrl}
          email={author.email}
          twitter={author.twitter}
          linkedin={author.linkedin}
          isOnAuthorPage
        />

        <h2 className="mt-12 font-heading text-2xl font-semibold tracking-tight">
          Posts by {author.name}{" "}
          <span className="text-base font-normal text-muted-foreground">({total})</span>
        </h2>

        {rows.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
            No published posts yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rows.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link
                href={`/authors/${author.slug}?page=${page - 1}`}
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
                href={`/authors/${author.slug}?page=${page + 1}`}
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
