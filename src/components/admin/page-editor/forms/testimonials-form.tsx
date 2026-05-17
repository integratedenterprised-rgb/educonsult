"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "../types";

export function TestimonialsForm({ index }: { index: number }) {
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
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Field label="Name">
                <Input {...register(`sections.${index}.data.items.${i}.name`)} />
              </Field>
              <Field label="Title / Program">
                <Input {...register(`sections.${index}.data.items.${i}.title`)} />
              </Field>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove" className="self-end">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Field label="Photo URL">
              <Input {...register(`sections.${index}.data.items.${i}.photoUrl`)} />
            </Field>
            <Field label="Quote">
              <Textarea rows={3} {...register(`sections.${index}.data.items.${i}.quote`)} />
            </Field>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ name: "", quote: "", title: "", photoUrl: "" })}
      >
        <Plus className="mr-1 h-4 w-4" /> Add testimonial
      </Button>
    </div>
  );
}
