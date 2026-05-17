/**
 * Blog-specific JSON-LD bundlers.
 *
 * Each post page emits *several* JSON-LD blocks: BlogPosting (article),
 * BreadcrumbList, FAQPage (when FAQs exist), and a person (for the author).
 * This module wraps the generic helpers in `lib/seo/json-ld.ts` so the
 * post route can call one function instead of orchestrating five.
 */
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, type JsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/metadata";

export interface BlogPostingInput {
  title: string;
  description: string | null;
  slug: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  authorName: string | null;
  authorSlug?: string | null;
  categoryName?: string | null;
  publisherName: string;
  publisherLogoUrl?: string;
  wordCount?: number | null;
}

export interface BlogPostJsonLdBundle {
  posting: JsonLd;
  breadcrumbs: JsonLd;
  faq?: JsonLd;
  author?: JsonLd;
}

export function blogPostJsonLd(input: {
  post: BlogPostingInput;
  faqs?: Array<{ q: string; a: string }>;
  breadcrumbs?: Array<{ name: string; path: string }>;
}): BlogPostJsonLdBundle {
  const post = input.post;
  const url = absoluteUrl(`/blog/${post.slug}`);

  const posting: JsonLd = {
    ...articleJsonLd({
      title: post.title,
      description: post.description,
      url,
      imageUrl: post.imageUrl,
      authorName: post.authorName,
      publisherName: post.publisherName,
      publisherLogoUrl: post.publisherLogoUrl,
      datePublished: post.publishedAt?.toISOString() ?? null,
      dateModified: post.updatedAt?.toISOString() ?? null,
    }),
    "@type": "BlogPosting",
    articleSection: post.categoryName ?? undefined,
    wordCount: post.wordCount ?? undefined,
  };

  const breadcrumbs = breadcrumbJsonLd(
    input.breadcrumbs ?? [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${post.slug}` },
    ],
  );

  const bundle: BlogPostJsonLdBundle = { posting, breadcrumbs };

  if (input.faqs && input.faqs.length > 0) {
    bundle.faq = faqJsonLd(input.faqs);
  }

  if (post.authorName) {
    bundle.author = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: post.authorName,
      url: post.authorSlug ? absoluteUrl(`/authors/${post.authorSlug}`) : undefined,
    };
  }

  return bundle;
}

export function blogListingJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  posts: Array<{ slug: string; title: string; publishedAt: Date | null }>;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    description: input.description ?? undefined,
    url: absoluteUrl(input.path),
    numberOfItems: input.posts.length,
    itemListElement: input.posts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/blog/${p.slug}`),
      name: p.title,
    })),
  };
}
