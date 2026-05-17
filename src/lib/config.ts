/**
 * Static, build-time configuration.
 *
 * Anything *content* (site name, tagline, contact info, social links) lives in
 * the `SiteSetting` table and is fetched at request time via
 * `getDynamicSiteConfig()`. This file only holds non-content defaults: locale
 * list, feature flags, route names, fallback values.
 */
import { clientEnv } from "./env";

export const siteConfig = {
  locales: ["en", "ne"] as const,
  defaultLocale: clientEnv.NEXT_PUBLIC_DEFAULT_LOCALE,
  url: clientEnv.NEXT_PUBLIC_SITE_URL,

  /** Used only as a last-resort fallback before the CMS row is fetched. */
  fallbackName: clientEnv.NEXT_PUBLIC_SITE_NAME,

  routes: {
    home: "/",
    admin: "/admin",
    login: "/login",
    api: {
      cms: "/api/cms",
      health: "/api/health",
    },
  },

  features: {
    blog: true,
    leads: true,
    multilingual: true,
    darkMode: true,
  },

  /** Cache durations (seconds) for revalidate-time-based ISR. */
  cache: {
    page: 60,
    nav: 300,
    theme: 60,
    settings: 60,
  },
} as const;

export type SiteConfig = typeof siteConfig;
export type SupportedLocale = (typeof siteConfig.locales)[number];
