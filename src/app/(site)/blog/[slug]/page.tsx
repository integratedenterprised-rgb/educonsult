/**
 * Blog post detail.
 *
 * - Two-column layout with sticky TOC + sidebar CTAs on lg+.
 * - Reading progress bar fixed at the top.
 * - Article schema + breadcrumb + FAQ schema emitted alongside the body.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ArticleHeader } from "@/components/blog/article-header";
import { AuthorCard } from "@/components/blog/author-card";
import { PostBody } from "@/components/blog/post-body";
import { PostFaq } from "@/components/blog/post-faq";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { RelatedPosts } from "@/components/blog/related-posts";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { InjectedCta, injectedCtaToHtml } from "@/components/blog/injected-cta";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/config";
import { blogPostJsonLd, renderBody, type TocItem, type CtaPlacement } from "@/lib/blog";
import {
  getBlogPostBySlug,
  getRelatedPosts,
  type BlogPostFull,
} from "@/server/cms/blog.service";

export const revalidate = 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Not found" };
  const seoT = post.seo?.translations.find((t) => t.locale === "EN") ?? post.seo?.translations[0];
  const authorName = pickAuthorName(post);
  return buildMetadata(
    {
      title: seoT?.title ?? post.title,
      description: seoT?.description ?? post.excerpt,
      keywords: seoT?.keywords,
      ogImageUrl: post.seo?.ogImageUrl ?? post.coverImageUrl,
      canonicalPath: `/blog/${post.slug}`,
      ogType: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authorName,
      noIndex: post.seo?.robots?.includes("noindex") ?? false,
    },
    siteConfig.fallbackName,
  );
}

export default async function BlogPostPage({ params }: RouteParams) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const ctas: CtaPlacement[] = post.ctaSlots
    .filter((c) => c.isVisible)
    .map((c) => ({
      placement: c.placement,
      anchor: c.anchor,
      paragraphIndex: c.paragraphIndex,
      html: injectedCtaToHtml({
        id: c.id,
        placement: c.placement,
        variant: c.variant,
        heading: c.heading,
        body: c.body,
        primaryLabel: c.primaryLabel,
        primaryUrl: c.primaryUrl,
        secondaryLabel: c.secondaryLabel,
        secondaryUrl: c.secondaryUrl,
        backgroundImage: c.backgroundImage,
        formKey: c.formKey,
      }),
    }));

  const rendered = renderBody({
    body: post.body,
    bodyFormat: post.bodyFormat,
    ctas,
    linkRules: post.internalLinks
      .filter((l) => l.isActive)
      .map((l) => ({ keyword: l.keyword, url: l.url, title: l.titleAttr ?? undefined })),
  });

  const toc: TocItem[] = Array.isArray(post.toc) ? (post.toc as unknown as TocItem[]) : rendered.toc;

  const authorName = pickAuthorName(post);
  const authorTitle = pickAuthorTitle(post);
  const authorBio = pickAuthorBio(post);
  const primaryCategory = post.categories[0]?.category;
  const primaryCategoryName =
    primaryCategory?.translations.find((t) => t.locale === "EN")?.name ??
    primaryCategory?.translations[0]?.name ??
    null;

  const related = await getRelatedPosts(post, 3);

  const ld = blogPostJsonLd({
    post: {
      title: post.title,
      description: post.excerpt,
      slug: post.slug,
      imageUrl: post.seo?.ogImageUrl ?? post.coverImageUrl,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      authorName,
      authorSlug: post.author?.slug,
      categoryName: primaryCategoryName,
      publisherName: siteConfig.fallbackName,
      wordCount: post.wordCount,
    },
    faqs: post.faqs.map((f) => ({ q: f.question, a: f.answer })),
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      ...(primaryCategory && primaryCategoryName
        ? [{ name: primaryCategoryName, path: `/blog/category/${primaryCategory.slug}` }]
        : []),
      { name: post.title, path: `/blog/${post.slug}` },
    ],
  });

  return (
    <>
      <ReadingProgress />
      <JsonLd data={[ld.posting, ld.breadcrumbs, ...(ld.faq ? [ld.faq] : []), ...(ld.author ? [ld.author] : [])]} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          ...(primaryCategory && primaryCategoryName
            ? [{ name: primaryCategoryName, path: `/blog/category/${primaryCategory.slug}` }]
            : []),
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
        className="pt-6"
      />

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          <article>
            <ArticleHeader
              title={post.title}
              excerpt={post.excerpt}
              publishedAt={post.publishedAt}
              readingMinutes={post.readingMinutes}
              coverImageUrl={post.coverImageUrl}
              coverImageAlt={post.coverImageAlt}
              author={
                post.author && authorName
                  ? {
                      slug: post.author.slug,
                      name: authorName,
                      avatarUrl: post.author.avatarUrl,
                      title: authorTitle,
                    }
                  : null
              }
              primaryCategory={
                primaryCategory && primaryCategoryName
                  ? { slug: primaryCategory.slug, name: primaryCategoryName }
                  : null
              }
            />

            <PostBody html={rendered.html} />

            {rendered.endCtas.map((html, i) => (
              <div key={`end-cta-${i}`} dangerouslySetInnerHTML={{ __html: html }} />
            ))}

            {post.tags.length > 0 ? (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6 text-sm">
                <span className="text-muted-foreground">Tags:</span>
                {post.tags.map(({ tag }) => (
                  <a
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-muted"
                  >
                    #{tag.name}
                  </a>
                ))}
              </div>
            ) : null}

            <PostFaq items={post.faqs.map((f) => ({ question: f.question, answer: f.answer }))} />

            {post.author && authorName ? (
              <AuthorCard
                slug={post.author.slug}
                name={authorName}
                title={authorTitle}
                bio={authorBio}
                avatarUrl={post.author.avatarUrl}
                email={post.author.email}
                twitter={post.author.twitter}
                linkedin={post.author.linkedin}
              />
            ) : null}

            <RelatedPosts posts={related} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <TableOfContents items={toc} />
              {post.ctaSlots
                .filter((c) => c.isVisible && c.placement === "SIDEBAR")
                .map((c) => (
                  <InjectedCta
                    key={c.id}
                    data={{
                      id: c.id,
                      placement: c.placement,
                      variant: c.variant,
                      heading: c.heading,
                      body: c.body,
                      primaryLabel: c.primaryLabel,
                      primaryUrl: c.primaryUrl,
                      secondaryLabel: c.secondaryLabel,
                      secondaryUrl: c.secondaryUrl,
                      backgroundImage: c.backgroundImage,
                      formKey: c.formKey,
                    }}
                  />
                ))}
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}

function pickAuthorName(post: BlogPostFull): string | null {
  if (!post.author) return null;
  return (
    post.author.translations.find((t) => t.locale === "EN")?.name ??
    post.author.translations[0]?.name ??
    null
  );
}

function pickAuthorTitle(post: BlogPostFull): string | null {
  if (!post.author) return null;
  return (
    post.author.translations.find((t) => t.locale === "EN")?.title ??
    post.author.translations[0]?.title ??
    null
  );
}

function pickAuthorBio(post: BlogPostFull): string | null {
  if (!post.author) return null;
  return (
    post.author.translations.find((t) => t.locale === "EN")?.bio ??
    post.author.translations[0]?.bio ??
    null
  );
}
