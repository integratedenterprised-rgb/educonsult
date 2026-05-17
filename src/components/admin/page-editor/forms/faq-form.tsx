"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "../types";

export function FaqForm({ index }: { index: number }) {
  const { register, control } = useFormContext<PageFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${index}.data.items` as const,
  });

  return (
    <div className="space-y-4">
      <Field label="Heading">
        <Input {...register(`sections.${index}.data.heading`)} />
      </Field>

      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={field.id} className="space-y-3 rounded-lg border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <Field label="Question" className="flex-1">
                <Input {...register(`sections.${index}.data.items.${i}.q`)} />
              </Field>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove" className="mt-6">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Field label="Answer">
              <Textarea rows={3} {...register(`sections.${index}.data.items.${i}.a`)} />
            </Field>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => append({ q: "", a: "" })}>
        <Plus className="mr-1 h-4 w-4" /> Add question
      </Button>
    </div>
  );
}
