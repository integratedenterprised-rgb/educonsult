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
import { authorUpsertSchema, type AuthorUpsertInput } from "@/lib/validators/blog";
import { slugify } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

interface AuthorRow {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  twitter: string | null;
  linkedin: string | null;
  postCount: number;
}

export function AuthorsAdmin({ initialAuthors }: { initialAuthors: AuthorRow[] }) {
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
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Authors</h1>
        </div>
        <Button onClick={() => setShowNew((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" /> {showNew ? "Close" : "New author"}
        </Button>
      </div>

      {showNew ? (
        <AuthorForm
          mode="create"
          onSaved={() => {
            setShowNew(false);
            router.refresh();
          }}
        />
      ) : null}

      <div className="space-y-2">
        {initialAuthors.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {a.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm">
                    {a.name.charAt(0)}
                  </span>
                )}
                <div>
                  <h3 className="font-medium">{a.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    /authors/{a.slug}{a.title ? ` · ${a.title}` : ""} · {a.postCount} posts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingId(editingId === a.id ? null : a.id)}>
                  {editingId === a.id ? "Close" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={async () => {
                    if (!confirm(`Delete ${a.name}?`)) return;
                    await fetch(`/api/admin/blog/authors/${a.id}`, { method: "DELETE" });
                    router.refresh();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {editingId === a.id ? (
              <div className="border-t border-border p-4">
                <AuthorForm
                  mode="update"
                  initial={a}
                  onSaved={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              </div>
            ) : null}
          </div>
        ))}
        {initialAuthors.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No authors yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AuthorForm({
  mode,
  initial,
  onSaved,
}: {
  mode: "create" | "update";
  initial?: AuthorRow;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AuthorUpsertInput>({
    resolver: zodResolver(authorUpsertSchema),
    defaultValues: {
      id: initial?.id,
      slug: initial?.slug ?? "",
      name: initial?.name ?? "",
      title: initial?.title ?? "",
      bio: initial?.bio ?? "",
      avatarUrl: initial?.avatarUrl ?? "",
      email: initial?.email ?? "",
      twitter: initial?.twitter ?? "",
      linkedin: initial?.linkedin ?? "",
    },
  });

  const slug = watch("slug");

  async function onSubmit(values: AuthorUpsertInput) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/blog/authors", {
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
        <CardTitle>{mode === "create" ? "New author" : "Edit author"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" error={errors.name?.message}>
              <Input
                {...register("name", {
                  onBlur: (e) => {
                    if (!slug && e.target.value) setValue("slug", slugify(e.target.value), { shouldValidate: true });
                  },
                })}
              />
            </Field>
            <Field label="Slug" error={errors.slug?.message}>
              <Input {...register("slug")} />
            </Field>
            <Field label="Title">
              <Input placeholder="Senior counselor" {...register("title", { setValueAs: (v) => (v === "" ? null : v) })} />
            </Field>
            <Field label="Avatar URL">
              <Input {...register("avatarUrl")} />
            </Field>
          </div>
          <Field label="Bio">
            <Textarea rows={3} {...register("bio", { setValueAs: (v) => (v === "" ? null : v) })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Email">
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Twitter handle">
              <Input placeholder="@…" {...register("twitter", { setValueAs: (v) => (v === "" ? null : v) })} />
            </Field>
            <Field label="LinkedIn URL">
              <Input {...register("linkedin", { setValueAs: (v) => (v === "" ? null : v) })} />
            </Field>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
