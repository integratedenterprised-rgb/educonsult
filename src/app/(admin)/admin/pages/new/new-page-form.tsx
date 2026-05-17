"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pageCreateSchema, type PageCreateInput } from "@/lib/validators/page";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Field } from "@/components/ui/molecules/field";
import { slugify } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";

export function NewPageForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PageCreateInput>({
    resolver: zodResolver(pageCreateSchema),
    defaultValues: { title: "", slug: "", template: null, isHomepage: false },
  });

  const slug = watch("slug");

  async function onSubmit(values: PageCreateInput) {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/pages", {
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
    router.push(`/admin/pages/${json.data.id}/edit`);
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
      <Field label="Slug" error={errors.slug?.message} hint="URL path — lowercase, dashes, '/' for nesting">
        <Input {...register("slug")} />
      </Field>
      <Field label="Template" hint="Optional renderer hint (e.g. landing)">
        <Input {...register("template", { setValueAs: (v) => (v === "" ? null : v) })} />
      </Field>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
