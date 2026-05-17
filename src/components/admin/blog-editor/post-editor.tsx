"use client";

/**
 * Blog post editor.
 *
 * Tabs: Content · SEO · Categorization · FAQ · CTAs · Internal links · Related
 * Sidebar: status / scheduling / feature toggle, save button, public-url
 * preview, live SEO score.
 *
 * All form state is managed by react-hook-form. zodResolver(`blogPostUpdateSchema`)
 * runs validation client-side; the API runs it again before persistence.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/organisms/tabs";
import { blogPostUpdateSchema } from "@/lib/validators/blog";
import { scoreSeo } from "@/lib/seo";
import { readingMetrics } from "@/lib/blog";
import type { ApiResponse } from "@/types/api";
import type { OptionRef, OtherPostRef, PostEditorValues } from "./types";
import { ContentTab } from "./content-tab";
import { SeoTab } from "./seo-tab";
import { CategorizationTab } from "./categorization-tab";
import { FaqTab } from "./faq-tab";
import { CtaTab } from "./cta-tab";
import { InternalLinkTab } from "./internal-link-tab";
import { RelatedTab } from "./related-tab";
import { SidebarPanel } from "./sidebar-panel";

interface Props {
  postId: string;
  initialValues: PostEditorValues;
  publicUrl: string;
  categories: OptionRef[];
  tags: OptionRef[];
  authors: OptionRef[];
  otherPosts: OtherPostRef[];
}

export function PostEditor({
  postId,
  initialValues,
  publicUrl,
  categories,
  tags,
  authors,
  otherPosts,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const methods = useForm<PostEditorValues>({
    resolver: zodResolver(blogPostUpdateSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const watch = methods.watch();

  const seoScore = useMemo(() => {
    const metrics = readingMetrics(watch.body ?? "");
    return scoreSeo({
      title: watch.title ?? "",
      metaTitle: watch.seoTitle,
      metaDescription: watch.seoDescription,
      metaKeywords: watch.seoKeywords,
      slug: watch.slug ?? "",
      ogImageUrl: watch.ogImageUrl || watch.coverImageUrl || null,
      bodyText: watch.body,
      hasFaq: (watch.faqs ?? []).length > 0,
      hasH1: true, // article title becomes the H1 at render
      internalLinkCount: (watch.internalLinks ?? []).length + countInternalLinks(watch.body ?? ""),
      externalLinkCount: countExternalLinks(watch.body ?? ""),
      sectionCount: 1,
    }) ;
  }, [
    watch.title,
    watch.slug,
    watch.body,
    watch.seoTitle,
    watch.seoDescription,
    watch.seoKeywords,
    watch.ogImageUrl,
    watch.coverImageUrl,
    watch.faqs,
    watch.internalLinks,
  ]);

  // Hint at unsaved changes when the browser unloads.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!methods.formState.isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [methods.formState.isDirty]);

  async function onSubmit(values: PostEditorValues) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/blog/${postId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as ApiResponse<{ slug: string }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setSavedAt(new Date());
    methods.reset(values, { keepValues: true });
    router.refresh();
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-3 w-3" /> Back to posts
            </Link>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              View live <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>

          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="categorization">Taxonomy</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="cta">CTAs</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <ContentTab />
            </TabsContent>
            <TabsContent value="seo" className="mt-4">
              <SeoTab />
            </TabsContent>
            <TabsContent value="categorization" className="mt-4">
              <CategorizationTab categories={categories} tags={tags} authors={authors} />
            </TabsContent>
            <TabsContent value="faq" className="mt-4">
              <FaqTab />
            </TabsContent>
            <TabsContent value="cta" className="mt-4">
              <CtaTab />
            </TabsContent>
            <TabsContent value="links" className="mt-4">
              <InternalLinkTab />
            </TabsContent>
            <TabsContent value="related" className="mt-4">
              <RelatedTab otherPosts={otherPosts} />
            </TabsContent>
          </Tabs>
        </div>

        <SidebarPanel
          saving={saving}
          error={error}
          savedAt={savedAt}
          seoScore={seoScore}
        />
      </form>
    </FormProvider>
  );
}

function countInternalLinks(body: string): number {
  return (body.match(/href="\/[^"]+"/g) ?? []).length;
}
function countExternalLinks(body: string): number {
  return (body.match(/href="https?:\/\/[^"]+"/g) ?? []).length;
}
