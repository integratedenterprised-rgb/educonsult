"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/molecules/card";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import { categoryUpsertSchema, type CategoryUpsertInput } from "@/lib/validators/blog";
import { slugify } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  order: number;
  postCount: number;
}

export function CategoriesAdmin({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to posts
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Categories</h1>
        </div>
        <Button onClick={() => setShowNew((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" /> {showNew ? "Close" : "New category"}
        </Button>
      </div>

      {showNew ? (
        <CategoryForm
          mode="create"
          onSaved={() => {
            setShowNew(false);
            router.refresh();
          }}
        />
      ) : null}

      <div className="space-y-2">
        {initialCategories.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-medium">{c.name}</h3>
                <p className="text-xs text-muted-foreground">/blog/category/{c.slug} · {c.postCount} posts</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                >
                  {editingId === c.id ? "Close" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={async () => {
                    if (!confirm(`Delete "${c.name}"?`)) return;
                    await fetch(`/api/admin/blog/categories/${c.id}`, { method: "DELETE" });
                    router.refresh();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {editingId === c.id ? (
              <div className="border-t border-border p-4">
                <CategoryForm
                  mode="update"
                  initial={c}
                  onSaved={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              </div>
            ) : null}
          </div>
        ))}
        {initialCategories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No categories yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface FormProps {
  mode: "create" | "update";
  initial?: CategoryRow;
  onSaved: () => void;
}

function CategoryForm({ mode, initial, onSaved }: FormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryUpsertInput>({
    resolver: zodResolver(categoryUpsertSchema),
    defaultValues: {
      id: initial?.id,
      slug: initial?.slug ?? "",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      iconUrl: initial?.iconUrl ?? "",
      order: initial?.order ?? 0,
      parentId: null,
      seoTitle: null,
      seoDescription: null,
      ogImageUrl: null,
    },
  });

  const slug = watch("slug");

  async function onSubmit(values: CategoryUpsertInput) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/blog/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    setSubmitting(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    onSaved();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "New category" : "Edit category"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" error={errors.name?.message}>
              <Input
                {...register("name", {
                  onBlur: (e) => {
                    if (!slug && e.target.value) {
                      setValue("slug", slugify(e.target.value), { shouldValidate: true });
                    }
                  },
                })}
              />
            </Field>
            <Field label="Slug" error={errors.slug?.message}>
              <Input {...register("slug")} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={2} {...register("description", { setValueAs: (v) => (v === "" ? null : v) })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Icon URL">
              <Input {...register("iconUrl")} />
            </Field>
            <Field label="Order">
              <Input type="number" {...register("order", { valueAsNumber: true })} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SEO title">
              <Input {...register("seoTitle", { setValueAs: (v) => (v === "" ? null : v) })} />
            </Field>
            <Field label="OG image">
              <Input {...register("ogImageUrl")} />
            </Field>
          </div>
          <Field label="SEO description">
            <Textarea rows={2} {...register("seoDescription", { setValueAs: (v) => (v === "" ? null : v) })} />
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
