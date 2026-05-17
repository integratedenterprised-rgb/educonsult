import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminPost } from "@/server/cms/admin-blog.service";
import { PostEditor } from "@/components/admin/blog-editor/post-editor";
import type { PostEditorValues } from "@/components/admin/blog-editor/types";
import { requirePermission } from "@/server/auth/session";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function EditPostRoute({ params }: RouteParams) {
  await requirePermission("blog.write");
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();

  const [categories, tags, authors, otherPosts] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      include: { translations: true },
    }),
    prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.author.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { translations: true },
    }),
    prisma.blogPost.findMany({
      where: { deletedAt: null, id: { not: id } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true, slug: true, status: true },
    }),
  ]);

  const seoT = post.seo?.translations.find((t) => t.locale === "EN") ?? post.seo?.translations[0];

  const initialValues: PostEditorValues = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    body: post.body,
    bodyFormat: post.bodyFormat,
    coverImageUrl: post.coverImageUrl ?? "",
    coverImageAlt: post.coverImageAlt ?? null,
    status: post.status,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    isFeatured: post.isFeatured,
    authorId: post.authorId ?? null,
    categoryIds: post.categories.map((c) => c.categoryId),
    tagIds: post.tags.map((t) => t.tagId),
    relatedPostIds: post.relatedFrom.map((r) => r.targetPostId),
    faqs: post.faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      order: f.order,
    })),
    ctaSlots: post.ctaSlots.map((c) => ({
      id: c.id,
      placement: c.placement,
      variant: c.variant,
      anchor: c.anchor ?? null,
      paragraphIndex: c.paragraphIndex ?? null,
      heading: c.heading,
      body: c.body ?? null,
      primaryLabel: c.primaryLabel ?? null,
      primaryUrl: c.primaryUrl ?? null,
      secondaryLabel: c.secondaryLabel ?? null,
      secondaryUrl: c.secondaryUrl ?? null,
      formKey: c.formKey ?? null,
      backgroundImage: c.backgroundImage ?? null,
      isVisible: c.isVisible,
      order: c.order,
    })),
    internalLinks: post.internalLinks.map((l) => ({
      id: l.id,
      keyword: l.keyword,
      url: l.url,
      titleAttr: l.titleAttr ?? null,
      isActive: l.isActive,
      order: l.order,
    })),
    seoTitle: seoT?.title ?? null,
    seoDescription: seoT?.description ?? null,
    seoKeywords: seoT?.keywords ?? null,
    ogImageUrl: post.seo?.ogImageUrl ?? "",
  };

  const publicUrl = `${siteConfig.url}/blog/${post.slug}`;

  return (
    <PostEditor
      postId={post.id}
      initialValues={initialValues}
      publicUrl={publicUrl}
      categories={categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.translations.find((t) => t.locale === "EN")?.name ?? c.translations[0]?.name ?? c.slug,
      }))}
      tags={tags.map((t) => ({ id: t.id, slug: t.slug, name: t.name }))}
      authors={authors.map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.translations.find((t) => t.locale === "EN")?.name ?? a.translations[0]?.name ?? a.slug,
      }))}
      otherPosts={otherPosts}
    />
  );
}
