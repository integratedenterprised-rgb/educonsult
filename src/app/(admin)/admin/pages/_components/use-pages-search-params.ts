"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Helper that turns the page-list filter state into a URL update.
 *
 * URL is the source of truth — filters, sort, search, and pagination all
 * round-trip through `?q&status&template&isHomepage&sort&order&page`, so
 * refreshes, back/forward, and link sharing all preserve the view.
 */
export function usePagesSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string | null | undefined>, options?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(search.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      if (options?.resetPage) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, search],
  );

  return { search, setParams };
}
