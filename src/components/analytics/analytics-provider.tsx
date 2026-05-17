"use client";

/**
 * Top-level analytics provider. Mounts once in the site layout.
 *
 * Responsibilities:
 *   - Boot the SDK with the public config (DNT + consent flags).
 *   - Fire `PAGE_VIEW` on every App Router navigation. The Next.js router
 *     doesn't full-reload, so we listen to pathname/search changes here.
 */
import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { init, trackPageView } from "@/lib/analytics/client";
import type { PublicAnalyticsConfig } from "@/server/analytics/config.service";

interface Props {
  config: PublicAnalyticsConfig;
  children?: React.ReactNode;
}

export function AnalyticsProvider({ config, children }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();
  const booted = React.useRef(false);

  React.useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    init({
      requireConsent: config.requireConsent,
      respectDoNotTrack: config.respectDoNotTrack,
    });
  }, [config.requireConsent, config.respectDoNotTrack]);

  React.useEffect(() => {
    if (!booted.current) return;
    trackPageView();
    // We deliberately include `search` so a query-only nav (e.g. filter
    // change) still counts as a page view; pages can opt out by passing a
    // stable key — but defaulting to "yes" matches how marketers think.
  }, [pathname, search]);

  return <>{children}</>;
}
