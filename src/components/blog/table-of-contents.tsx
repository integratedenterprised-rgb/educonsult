"use client";

/**
 * Sticky table of contents with scroll-spy.
 *
 * Receives the TOC array computed at save time (cached on the post row). At
 * render we hook an IntersectionObserver to every heading id so the active
 * link follows the user's reading position.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import type { TocItem } from "@/lib/blog";
import { cn } from "@/lib/utils";

interface Props {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: Props) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting heading. Falls back to the last
        // entry that's above the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0% -70% 0%", threshold: [0, 1] },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className={cn("text-sm", className)}>
      <p className="mb-3 font-semibold uppercase tracking-wide text-xs text-muted-foreground">
        On this page
      </p>
      <ol className="space-y-1.5 border-l border-border">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              item.level === 3 && "pl-3",
              item.level === 4 && "pl-6",
            )}
          >
            <Link
              href={`#${item.id}`}
              className={cn(
                "block border-l-2 pl-3 py-0.5 -ml-px transition",
                activeId === item.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.text}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
