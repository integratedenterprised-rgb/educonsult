/**
 * Renders the post body HTML produced by `lib/blog/render.ts`.
 *
 * Wrapped in the Tailwind `prose` class for typography. The injected
 * heading ids + CTAs are already part of the HTML; nothing client-side
 * is needed to surface them.
 */
import { cn } from "@/lib/utils";

interface Props {
  html: string;
  className?: string;
}

export function PostBody({ html, className }: Props) {
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none dark:prose-invert",
        "prose-headings:font-heading prose-headings:tracking-tight",
        "prose-h2:mt-12 prose-h2:scroll-mt-24",
        "prose-h3:mt-8 prose-h3:scroll-mt-24",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-img:rounded-lg",
        "prose-pre:bg-muted prose-pre:text-foreground",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
