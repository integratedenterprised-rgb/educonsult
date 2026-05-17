/**
 * Article header — title, byline, metadata strip, hero image.
 *
 * Server component. Renders the H1 (which is also the SEO title fallback)
 * and the byline row that links to author + category. Cover image, when
 * present, gets 1200×630-ish framing for OG parity.
 */
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock } from "lucide-react";

interface Props {
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  readingMinutes: number | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  author: { slug: string; name: string; avatarUrl: string | null; title: string | null } | null;
  primaryCategory: { slug: string; name: string } | null;
}

export function ArticleHeader({
  title,
  excerpt,
  publishedAt,
  readingMinutes,
  coverImageUrl,
  coverImageAlt,
  author,
  primaryCategory,
}: Props) {
  return (
    <header className="mb-10">
      {primaryCategory ? (
        <Link
          href={`/blog/category/${primaryCategory.slug}`}
          className="inline-block text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
        >
          {primaryCategory.name}
        </Link>
      ) : null}

      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h1>

      {excerpt ? (
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground sm:text-xl">{excerpt}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {author ? (
          <Link
            href={`/authors/${author.slug}`}
            className="flex items-center gap-2 hover:text-foreground"
          >
            {author.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt=""
                width={32}
                height={32}
                sizes="32px"
                loading="lazy"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">
                {author.name.charAt(0)}
              </span>
            )}
            <span>
              <span className="font-medium text-foreground">{author.name}</span>
              {author.title ? <span className="ml-1.5 text-xs">· {author.title}</span> : null}
            </span>
          </Link>
        ) : null}
        {publishedAt ? (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <time dateTime={publishedAt.toISOString()}>
              {publishedAt.toLocaleDateString("en", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </span>
        ) : null}
        {readingMinutes ? (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {readingMinutes} min read
          </span>
        ) : null}
      </div>

      {coverImageUrl ? (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-muted">
          <Image
            src={coverImageUrl}
            alt={coverImageAlt ?? ""}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            priority
            quality={80}
            className="object-cover"
          />
        </div>
      ) : null}
    </header>
  );
}
