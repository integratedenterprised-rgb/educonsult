import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Poppins } from "next/font/google";
import { ThemeStyle } from "@/components/providers/theme-style";
import { Providers } from "@/components/providers/providers";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteSettings } from "@/server/cms/settings.service";
import { getActiveTheme } from "@/server/cms/theme.service";
import { buildMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import "./globals.css";

// Force per-request rendering so middleware's CSP nonce is available to
// Next's render pipeline. Without this, Next prerenders the layout shell at
// build time (no request → no nonce) and the runtime CSP nonce won't match
// the cached HTML's script nonces. Data fetches inside the layout already
// hit unstable_cache, so the cost is small.
export const dynamic = "force-dynamic";

// Body font. `display: swap` shows fallback immediately (no FOIT). next/font
// self-hosts the file, so no third-party DNS / TLS on the critical path.
// `adjustFontFallback` tunes the system fallback metrics to match Inter,
// eliminating layout shift between fallback and webfont swap.
const fontBody = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  preload: true,
  adjustFontFallback: true,
});

// Heading font, preloaded only for the weights we actually use to keep
// transfer size small. Two webfont families is the practical ceiling before
// LCP regresses.
const fontHeading = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-heading",
  preload: true,
  adjustFontFallback: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({ title: settings.name, description: settings.tagline }, settings.name);
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, settings, hdrs] = await Promise.all([getActiveTheme(), getSiteSettings(), headers()]);
  const nonce = hdrs.get("x-nonce") ?? undefined;

  // Organization + WebSite schemas emit once site-wide. Per-page schemas
  // (WebPage, Article, BreadcrumbList, FAQPage) are emitted by the leaf route.
  const orgLd = organizationJsonLd({
    name: settings.name,
    url: siteConfig.url,
    logoUrl: settings.logoUrl || undefined,
    contact: settings.contact,
    sameAs: [settings.social.facebook, settings.social.instagram, settings.social.linkedin].filter(
      Boolean,
    ),
  });
  const siteLd = websiteJsonLd({ name: settings.name, url: siteConfig.url });

  return (
    <html
      lang={siteConfig.defaultLocale}
      suppressHydrationWarning
      className={cn(fontBody.variable, fontHeading.variable, theme.isDarkMode && "dark")}
    >
      <head>
        {/* Warm up TCP+TLS to image/asset hosts we know we'll hit. Cheap when
            the host is unused; saves the first connection RTT when it is. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <ThemeStyle />
        <JsonLd data={[orgLd, siteLd]} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Providers forcedDark={theme.isDarkMode} nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
