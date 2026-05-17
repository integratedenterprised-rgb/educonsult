"use client";

import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query from a client component.
 *
 * Returns `false` on the server and during the first client render to avoid
 * hydration mismatch — components that rely on it should treat the initial
 * value as "unknown" and render the mobile/default branch first.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
export const useIsLargeScreen = () => useMediaQuery("(min-width: 1024px)");
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
