"use client";

/**
 * Reading-progress bar.
 *
 * Tracks how far the user has scrolled through the article element (selected
 * via `targetSelector`) and renders a fixed bar at the top of the viewport.
 * Uses `requestAnimationFrame` to throttle the scroll handler.
 *
 * No state is shared with the server — the bar is purely visual feedback.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  targetSelector?: string;
  className?: string;
}

export function ReadingProgress({ targetSelector = "article", className }: Props) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const article = document.querySelector(targetSelector);
    if (!article) return;

    const compute = () => {
      frame.current = null;
      const rect = article.getBoundingClientRect();
      const totalHeight = rect.height;
      const viewportH = window.innerHeight;
      const distanceFromTop = -rect.top;
      const scrollable = Math.max(1, totalHeight - viewportH);
      const pct = Math.min(1, Math.max(0, distanceFromTop / scrollable));
      setProgress(pct);
    };

    const onScroll = () => {
      if (frame.current != null) return;
      frame.current = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [targetSelector]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-1 bg-transparent",
        className,
      )}
      aria-hidden
    >
      <div
        className="h-full bg-primary transition-[width] duration-150"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
