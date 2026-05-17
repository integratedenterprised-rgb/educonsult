import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

/**
 * robots.txt. Allow everything except admin/API for general crawlers; let
 * GPTBot and ClaudeBot in so AI-search surfaces can find content (good for
 * brand visibility in chat-driven discovery).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      // AI crawlers — explicit allow so policy is documented in source.
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
