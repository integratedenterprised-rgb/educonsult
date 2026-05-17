/**
 * Metadata helpers — convert CMS-driven SEO records into Next.js `Metadata`.
 *
 * Every public page should build its `Metadata` through `buildMetadata` so
 * defaults (canonical, OG, Twitter, robots) stay consistent and admin
 * overrides come through automatically.
 */
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

const DEFAULT_OG_IMAGE = "/og-default.png";
const DEFAULT_LOCALE_TAG: Record<string, string> = {
  en: "en_US",
  ne: "ne_NP",
};

export interface SeoInput {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogImageUrl?: string | null;
  /** Path on the site (e.g. "/about"). Combined with siteUrl for canonical. */
  canonicalPath?: string | null;
  /** When set, also emits `noindex,nofollow`. */
  noIndex?: boolean;
  /** Override the default OG type ("website"). For posts use "article". */
  ogType?: "website" | "article";
  /** ISO publication date. Surfaces in Article metadata. */
  publishedTime?: string | null;
  /** ISO last-modified date. */
  modifiedTime?: string | null;
  /** Author display name for article-type pages. */
  authorName?: string | null;
  /** Optional alternate locales to advertise (BCP-47 codes). */
  alternateLocales?: string[];
}

export function buildMetadata(input: SeoInput, fallbackSiteName: string): Metadata {
  const title = input.title ?? fallbackSiteName;
  const description = input.description ?? undefined;
  const canonical = absoluteUrl(input.canonicalPath ?? "/");
  const ogImage = input.ogImageUrl ?? DEFAULT_OG_IMAGE;
  const ogType = input.ogType ?? "website";
  const localeTag = DEFAULT_LOCALE_TAG[siteConfig.defaultLocale] ?? "en_US";

  return {
    title: { default: title, template: `%s — ${fallbackSiteName}` },
    description,
    keywords: input.keywords ?? undefined,
    applicationName: fallbackSiteName,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical,
      languages: input.alternateLocales
        ? Object.fromEntries(
            input.alternateLocales.map((loc) => [loc, `${canonical}?lang=${loc}`]),
          )
        : undefined,
    },
    robots: input.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    formatDetection: { telephone: false, address: false, email: false },

    openGraph: {
      type: ogType,
      url: canonical,
      title,
      description,
      siteName: fallbackSiteName,
      locale: localeTag,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(ogType === "article" && (input.publishedTime || input.modifiedTime || input.authorName)
        ? {
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
            authors: input.authorName ? [input.authorName] : undefined,
          }
        : {}),
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
      site: process.env.NEXT_PUBLIC_TWITTER_HANDLE || undefined,
    },

    other: {
      // Helps preview tooling and ensures the published time survives
      // even when the platform's OG type isn't `article`.
      ...(input.publishedTime ? { "article:published_time": input.publishedTime } : {}),
      ...(input.modifiedTime ? { "article:modified_time": input.modifiedTime } : {}),
    },
  };
}

export function absoluteUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
