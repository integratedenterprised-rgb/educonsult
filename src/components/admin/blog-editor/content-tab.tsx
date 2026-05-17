"use client";

/**
 * Content tab — title, slug, excerpt, cover image, body editor, body-format
 * selector.
 *
 * The body editor here is a focused-textarea with a small toolbar that wraps
 * the selection in HTML/Markdown affordances. A real WYSIWYG (Tiptap /
 * Lexical) can drop in by replacing `<BodyEditor />` without touching the
 * form schema.
 */
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/molecules/card";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import { slugify } from "@/lib/utils";
import type { PostEditorValues } from "./types";
import { BodyEditor } from "./body-editor";

export function ContentTab() {
  const { register, watch, setValue, formState } = useFormContext<PostEditorValues>();
  const slug = watch("slug");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Headline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Title" error={formState.errors.title?.message}>
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
          <Field label="Slug" error={formState.errors.slug?.message} hint="Lowercase, dashes only">
            <Input {...register("slug")} />
          </Field>
          <Field label="Excerpt" hint="2–3 sentences. Used in cards and as meta-description fallback.">
            <Textarea
              rows={3}
              {...register("excerpt", { setValueAs: (v) => (v === "" ? null : v) })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover image</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="space-y-4">
            <Field label="Image URL" hint="1200×630 ideal — also reused as OG image fallback">
              <Input placeholder="https://…" {...register("coverImageUrl")} />
            </Field>
            <Field label="Alt text" hint="Describe the image for screen readers and SEO">
              <Input
                {...register("coverImageAlt", { setValueAs: (v) => (v === "" ? null : v) })}
              />
            </Field>
          </div>
          {watch("coverImageUrl") ? (
            <div className="overflow-hidden rounded-md border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={watch("coverImageUrl") ?? ""}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Body</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Format" hint="HTML / MDX (lightweight) / Lexical JSON">
            <select
              {...register("bodyFormat")}
              className="flex h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="HTML">HTML</option>
              <option value="MDX">MDX</option>
              <option value="LEXICAL_JSON">Lexical JSON</option>
            </select>
          </Field>
          <BodyEditor />
        </CardContent>
      </Card>
    </div>
  );
}
