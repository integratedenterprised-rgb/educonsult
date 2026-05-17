"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/molecules/card";
import { Field } from "@/components/ui/molecules/field";
import type { OptionRef, PostEditorValues } from "./types";

interface Props {
  categories: OptionRef[];
  tags: OptionRef[];
  authors: OptionRef[];
}

export function CategorizationTab({ categories, tags, authors }: Props) {
  const { register, watch, setValue } = useFormContext<PostEditorValues>();
  const selectedCategoryIds = watch("categoryIds") ?? [];
  const selectedTagIds = watch("tagIds") ?? [];

  function toggleArray(field: "categoryIds" | "tagIds", id: string) {
    const cur = (watch(field) ?? []) as string[];
    setValue(field, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id], {
      shouldDirty: true,
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Author</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Author">
            <select
              {...register("authorId", { setValueAs: (v) => (v === "" ? null : v) })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">No author</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = selectedCategoryIds.includes(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggleArray("categoryIds", c.id)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const active = selectedTagIds.includes(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => toggleArray("tagIds", t.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      #{t.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
