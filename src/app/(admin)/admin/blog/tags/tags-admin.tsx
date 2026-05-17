"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Field } from "@/components/ui/molecules/field";
import { tagUpsertSchema, type TagUpsertInput } from "@/lib/validators/blog";
import { slugify } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface TagRow {
  id: string;
  slug: string;
  name: string;
  postCount: number;
}

export function TagsAdmin({ initialTags }: { initialTags: TagRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TagUpsertInput>({
    resolver: zodResolver(tagUpsertSchema),
    defaultValues: { slug: "", name: "" },
  });

  const slug = watch("slug");

  async function onSubmit(values: TagUpsertInput) {
    setError(null);
    const res = await fetch("/api/admin/blog/tags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    reset({ slug: "", name: "" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to posts
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Tags</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3 rounded-lg border border-border bg-card p-4">
        <Field label="Name" error={errors.name?.message} className="flex-1">
          <Input
            {...register("name", {
              onBlur: (e) => {
                if (!slug && e.target.value) setValue("slug", slugify(e.target.value), { shouldValidate: true });
              },
            })}
          />
        </Field>
        <Field label="Slug" error={errors.slug?.message} className="flex-1">
          <Input {...register("slug")} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {initialTags.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          No tags yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {initialTags.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-sm">
              <span>
                #{t.name} <span className="text-xs text-muted-foreground">· {t.postCount} posts</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={async () => {
                  if (!confirm(`Delete #${t.name}?`)) return;
                  await fetch(`/api/admin/blog/tags/${t.id}`, { method: "DELETE" });
                  router.refresh();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
