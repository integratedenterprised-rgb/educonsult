import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar/navbar";
import { Footer } from "@/components/layout/footer/footer";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { HeatmapScript } from "@/components/analytics/heatmap-script";
import { getPublicAnalyticsConfig } from "@/server/analytics/config.service";

/**
 * Public-site layout. Wraps every non-admin route with the CMS-driven navbar
 * and footer. Pages render between them via {children}.
 *
 * Analytics is mounted here (not in the root layout) so admin routes don't
 * load heatmap pixels. The provider listens for App Router navigations and
 * fires `PAGE_VIEW`; the script tags inject GA4/Clarity/Hotjar/etc when
 * configured via /admin/analytics/config.
 *
 * Suspense boundary scope: only the heatmap script can plausibly suspend
 * (config read inside a server component). Wrapping the whole page tree in
 * Suspense with `fallback={null}` would briefly blank the screen if anything
 * inside ever suspends; scope it tightly to the analytics machinery instead.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const analyticsConfig = await getPublicAnalyticsConfig();
  return (
    <AnalyticsProvider config={analyticsConfig}>
      <Suspense fallback={null}>
        <HeatmapScript />
      </Suspense>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </AnalyticsProvider>
  );
}
