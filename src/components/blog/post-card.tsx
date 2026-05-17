/**
 * Post card — used on the blog index, category, tag, and author pages.
 */
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock } from "lucide-react";
import type { BlogPostSummary } from "@/server/cms/blog.service";

export function PostCard({ post, featured }: { post: BlogPostSummary; featured?: boolean }) {
  const category = post.categories[0]?.category;
  const categoryName =
    category?.translations.find((t) => t.locale === "EN")?.name ??
    category?.translations[0]?.name;
  const authorName =
    post.author?.translations.find((t) => t.locale === "EN")?.name ??
    post.author?.translations[0]?.name;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md ${
        featured ? "md:col-span-2 md:flex-row" : ""
      }`}
    >
      {post.coverImageUrl ? (
        <Link
          href={`/blog/${post.slug}`}
          className={`relative block overflow-hidden bg-muted ${
            featured ? "aspect-[16/9] md:aspect-auto md:w-1/2" : "aspect-[16/9]"
          }`}
        >
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 50vw"}
            priority={featured}
            loading={featured ? undefined : "lazy"}
            className="object-cover transition group-hover:scale-[1.02]"
          />
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          {categoryName ? (
            <Link
              href={`/blog/category/${category?.slug}`}
              className="font-semibold text-primary hover:underline"
            >
              {categoryName}
            </Link>
          ) : null}
        </div>
        <h2 className={`mt-2 font-heading font-semibold leading-snug ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}>
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? (
          <p className={`mt-2 text-muted-foreground ${featured ? "text-base" : "line-clamp-3 text-sm"}`}>
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-xs text-muted-foreground">
          {authorName && post.author ? (
            <Link href={`/authors/${post.author.slug}`} className="font-medium hover:text-foreground">
              {authorName}
            </Link>
          ) : null}
          {post.publishedAt ? (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              <time dateTime={post.publishedAt.toISOString()}>
                {post.publishedAt.toLocaleDateString("en", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </span>
          ) : null}
          {post.readingMinutes ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readingMinutes} min
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
