/**
 * Strongly-typed JSON-LD generators for schema.org types we emit.
 *
 * All generators are pure functions that return a JSON-serializable object.
 * The `<JsonLd />` server component wraps the result in a script tag with
 * `type="application/ld+json"`.
 *
 * Reference: https://schema.org/ and Google's structured-data guidelines.
 */
import { absoluteUrl } from "./metadata";

interface Thing {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
}

/** Site-wide identity — emit once in the root layout. */
export function organizationJsonLd(input: {
  name: string;
  url: string;
  logoUrl?: string;
  sameAs?: string[];
  contact?: { email?: string; phone?: string; address?: string };
}): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: input.name,
    url: input.url,
    logo: input.logoUrl,
    sameAs: input.sameAs?.filter(Boolean),
    contactPoint: input.contact?.email
      ? {
          "@type": "ContactPoint",
          email: input.contact.email,
          telephone: input.contact.phone,
          contactType: "customer support",
        }
      : undefined,
    address: input.contact?.address
      ? { "@type": "PostalAddress", streetAddress: input.contact.address }
      : undefined,
  };
}

/** Surfaces the sitelinks search box in SERPs (when supported). */
export function websiteJsonLd(input: { name: string; url: string }): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${input.url.replace(/\/$/, "")}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** Generic page wrapper — emit on every public route. */
export function webPageJsonLd(input: {
  title: string;
  description?: string | null;
  url: string;
  inLanguage?: string;
  ogImageUrl?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description ?? undefined,
    url: input.url,
    inLanguage: input.inLanguage ?? "en",
    primaryImageOfPage: input.ogImageUrl ?? undefined,
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? undefined,
  };
}

/** Blog posts / articles. */
export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  authorName?: string | null;
  publisherName: string;
  publisherLogoUrl?: string;
  datePublished?: string | null;
  dateModified?: string | null;
}): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description ?? undefined,
    mainEntityOfPage: input.url,
    image: input.imageUrl ? [input.imageUrl] : undefined,
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? input.datePublished ?? undefined,
    author: input.authorName ? { "@type": "Person", name: input.authorName } : undefined,
    publisher: {
      "@type": "Organization",
      name: input.publisherName,
      logo: input.publisherLogoUrl
        ? { "@type": "ImageObject", url: input.publisherLogoUrl }
        : undefined,
    },
  };
}

/** Course detail pages — schema.org/Course. */
export function courseJsonLd(input: {
  name: string;
  description?: string | null;
  url: string;
  providerName: string;
  providerUrl?: string;
  inLanguage?: string;
  educationalLevel?: string;
}): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    description: input.description ?? undefined,
    url: input.url,
    educationalLevel: input.educationalLevel,
    inLanguage: input.inLanguage ?? "en",
    provider: {
      "@type": "Organization",
      name: input.providerName,
      sameAs: input.providerUrl,
    },
  };
}

/** Per-page breadcrumb trail. */
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** FAQ schema for FAQ sections — Google can render directly in SERPs. */
export function faqJsonLd(items: Array<{ q: string; a: string }>): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/** Student testimonial → Review schema. */
export function reviewJsonLd(input: {
  itemReviewedName: string;
  reviewBody: string;
  authorName: string;
  rating?: number;
}): Thing {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "EducationalOrganization", name: input.itemReviewedName },
    reviewBody: input.reviewBody,
    author: { "@type": "Person", name: input.authorName },
    reviewRating: input.rating
      ? { "@type": "Rating", ratingValue: input.rating, bestRating: 5 }
      : undefined,
  };
}

export type JsonLd = Thing;
