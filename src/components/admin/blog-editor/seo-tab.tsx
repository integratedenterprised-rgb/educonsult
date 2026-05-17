"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/molecules/card";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PostEditorValues } from "./types";

export function SeoTab() {
  const { register, watch } = useFormContext<PostEditorValues>();
  const seoTitle = watch("seoTitle") ?? "";
  const seoDescription = watch("seoDescription") ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search engine metadata</CardTitle>
        <CardDescription>
          Falls back to the post title, excerpt, and cover image when blank.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Field
          label="Meta title"
          hint={`${seoTitle.length} / 60 recommended`}
        >
          <Input {...register("seoTitle", { setValueAs: (v) => (v === "" ? null : v) })} />
        </Field>
        <Field
          label="Meta description"
          hint={`${seoDescription.length} / 160 recommended`}
        >
          <Textarea
            rows={3}
            {...register("seoDescription", { setValueAs: (v) => (v === "" ? null : v) })}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Keywords" hint="Comma-separated">
            <Input {...register("seoKeywords", { setValueAs: (v) => (v === "" ? null : v) })} />
          </Field>
          <Field label="OG image override" hint="Defaults to cover image">
            <Input placeholder="https://…" {...register("ogImageUrl")} />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
