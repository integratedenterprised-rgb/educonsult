"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { blogPostCreateSchema, type BlogPostCreateInput } from "@/lib/validators/blog";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import { slugify } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

export function NewPostForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogPostCreateInput>({
    resolver: zodResolver(blogPostCreateSchema),
    defaultValues: { title: "", slug: "", excerpt: "", authorId: "" },
  });

  const slug = watch("slug");

  async function onSubmit(values: BlogPostCreateInput) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as ApiResponse<{ id: string }>;
    setSubmitting(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    router.push(`/admin/blog/${json.data.id}/edit`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Title" error={errors.title?.message}>
        <Input
          {...register("title", {
            onBlur: (e) => {
              if (!slug && e.target.value) {
                setValue("slug", slugify(e.target.value), { shouldValidate: true });
              }
            },
          })}
        />
      </Field>
      <Field label="Slug" error={errors.slug?.message} hint="Lowercase, dashes only">
        <Input {...register("slug")} />
      </Field>
      <Field label="Excerpt" hint="Optional preview text used in cards and meta description">
        <Textarea
          rows={3}
          {...register("excerpt", { setValueAs: (v) => (v === "" ? null : v) })}
        />
      </Field>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}
