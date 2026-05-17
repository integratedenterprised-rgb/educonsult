"use client";

/**
 * Blog scroll-depth tracker — fires 25/50/75/100% events as the visitor
 * progresses through the article. Each threshold fires at most once.
 *
 * Mount inside the blog post layout. The `postId` identifies the row in
 * AnalyticsEvent; the dashboard's "completed reads" tile counts
 * `BLOG_READ_COMPLETE` against `BLOG_VIEW`.
 */
import * as React from "react";
import { track } from "@/lib/analytics/client";

interface Props {
  postId: string;
}

export function BlogScrollTracker({ postId }: Props) {
  React.useEffect(() => {
    track("BLOG_VIEW", { blogPostId: postId });
    const fired = new Set<number>();

    const handler = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      if (total <= 0) return;
      const pct = (window.scrollY / total) * 100;
      for (const threshold of [25, 50, 75, 100]) {
        if (pct >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          if (threshold === 25) track("BLOG_SCROLL_25", { blogPostId: postId });
          else if (threshold === 50) track("BLOG_SCROLL_50", { blogPostId: postId });
          else if (threshold === 75) track("BLOG_SCROLL_75", { blogPostId: postId });
          else if (threshold === 100) track("BLOG_READ_COMPLETE", { blogPostId: postId });
        }
      }
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        handler();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handler();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [postId]);

  return null;
}
