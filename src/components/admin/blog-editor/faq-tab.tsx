"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/molecules/card";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PostEditorValues } from "./types";

export function FaqTab() {
  const { register, control } = useFormContext<PostEditorValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "faqs" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQs</CardTitle>
        <CardDescription>
          Rendered at the bottom of the post and emitted as FAQ schema for Google rich results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No FAQs yet.
          </p>
        ) : (
          fields.map((field, i) => (
            <div key={field.id} className="space-y-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <Field label="Question" className="flex-1">
                  <Input {...register(`faqs.${i}.question` as const)} />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  aria-label="Remove"
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Field label="Answer">
                <Textarea rows={3} {...register(`faqs.${i}.answer` as const)} />
              </Field>
              <input type="hidden" {...register(`faqs.${i}.order` as const, { valueAsNumber: true })} value={i} />
            </div>
          ))
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ question: "", answer: "", order: fields.length })}
        >
          <Plus className="mr-1 h-4 w-4" /> Add question
        </Button>
      </CardContent>
    </Card>
  );
}
