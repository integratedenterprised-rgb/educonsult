/**
 * Public authors directory — every author with at least one published post.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata(
  {
    title: "Authors",
    description: "Counselors, writers, and contributors behind our content.",
    canonicalPath: "/authors",
  },
  siteConfig.fallbackName,
);

export default async function AuthorsIndex() {
  const authors = await prisma.author.findMany({
    where: {
      deletedAt: null,
      posts: { some: { status: "PUBLISHED", deletedAt: null } },
    },
    include: {
      translations: true,
      _count: { select: { posts: { where: { status: "PUBLISHED", deletedAt: null } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Authors", path: "/authors" },
        ]}
        className="pt-6"
      />
      <Container className="py-10">
        <header className="mb-8">
          <h1 className="font-heading text-4xl font-bold tracking-tight">Authors</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
            Counselors, writers, and contributors behind our content.
          </p>
        </header>

        {authors.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">
            No authors yet.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((a) => {
              const t = a.translations.find((x) => x.locale === "EN") ?? a.translations[0];
              return (
                <li key={a.id}>
                  <Link
                    href={`/authors/${a.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition hover:shadow-md"
                  >
                    {a.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.avatarUrl}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        {(t?.name ?? a.slug).charAt(0)}
                      </span>
                    )}
                    <div>
                      <p className="font-medium">{t?.name ?? a.slug}</p>
                      {t?.title ? <p className="text-xs text-muted-foreground">{t.title}</p> : null}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a._count.posts} {a._count.posts === 1 ? "post" : "posts"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
