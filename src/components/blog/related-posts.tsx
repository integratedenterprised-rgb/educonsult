/**
 * Related-posts grid — rendered at the bottom of every article.
 *
 * Cards link to `/blog/<slug>` and show cover, title, reading time, and
 * primary category. Designed to be small (3 across on desktop) so the
 * footer of the article stays compact.
 */
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import type { BlogPostSummary } from "@/server/cms/blog.service";

export function RelatedPosts({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-16 border-t border-border pt-10" aria-labelledby="related-posts-heading">
      <h2 id="related-posts-heading" className="font-heading text-2xl font-semibold tracking-tight">
        Keep reading
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const category = post.categories[0]?.category;
          const categoryName =
            category?.translations.find((t) => t.locale === "EN")?.name ??
            category?.translations[0]?.name;

          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:shadow-md"
            >
              {post.coverImageUrl ? (
                <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                  <Image
                    src={post.coverImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-5">
                {categoryName ? (
                  <span className="text-xs font-medium uppercase tracking-wide text-primary">
                    {categoryName}
                  </span>
                ) : null}
                <h3 className="mt-1 font-heading text-lg font-semibold leading-snug group-hover:underline">
                  {post.title}
                </h3>
                {post.excerpt ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                ) : null}
                {post.readingMinutes ? (
                  <p className="mt-auto flex items-center gap-1 pt-3 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {post.readingMinutes} min read
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

