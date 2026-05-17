"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/molecules/card";
import { Input } from "@/components/ui/atoms/input";
import { Field } from "@/components/ui/molecules/field";
import type { PostEditorValues } from "./types";

export function InternalLinkTab() {
  const { register, control } = useFormContext<PostEditorValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "internalLinks" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal-link rules</CardTitle>
        <CardDescription>
          The first occurrence of each keyword in the body is auto-linked to the URL. Layered on top of global rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No rules configured.
          </p>
        ) : (
          fields.map((field, i) => (
            <div key={field.id} className="grid items-end gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_2fr_1fr_auto]">
              <Field label="Keyword">
                <Input {...register(`internalLinks.${i}.keyword` as const)} />
              </Field>
              <Field label="URL">
                <Input {...register(`internalLinks.${i}.url` as const)} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register(`internalLinks.${i}.isActive` as const)} />
                Active
              </label>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </Button>
              <input type="hidden" {...register(`internalLinks.${i}.order` as const, { valueAsNumber: true })} value={i} />
            </div>
          ))
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              keyword: "",
              url: "",
              titleAttr: null,
              isActive: true,
              order: fields.length,
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" /> Add rule
        </Button>
      </CardContent>
    </Card>
  );
}
