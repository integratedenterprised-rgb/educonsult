"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "../types";

export function EligibilityForm({ index }: { index: number }) {
  const { register, control } = useFormContext<PageFormValues>();
  const criteria = useFieldArray({ control, name: `sections.${index}.data.criteria` as const });
  const prefix = `sections.${index}.data` as const;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Heading">
          <Input {...register(`${prefix}.heading`)} />
        </Field>
        <Field label="Subheading">
          <Input {...register(`${prefix}.subheading`)} />
        </Field>
      </div>

      <div className="space-y-3">
        {criteria.fields.map((field, i) => (
          <div key={field.id} className="space-y-2 rounded-lg border border-border bg-background p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Field label="Label">
                <Input {...register(`sections.${index}.data.criteria.${i}.label`)} />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => criteria.remove(i)}
                aria-label="Remove"
                className="self-end"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Field label="Description" hint="Optional explanation shown under the criterion">
              <Textarea rows={2} {...register(`sections.${index}.data.criteria.${i}.description`)} />
            </Field>
            <Field label="Icon key" hint="Optional lucide icon name (e.g. graduation-cap)">
              <Input
                placeholder="check-circle-2"
                {...register(`sections.${index}.data.criteria.${i}.iconKey`)}
              />
            </Field>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => criteria.append({ label: "", description: "", iconKey: "" })}
      >
        <Plus className="mr-1 h-4 w-4" /> Add criterion
      </Button>

      <div className="grid gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-2">
        <Field label="CTA label">
          <Input {...register(`${prefix}.ctaLabel`)} />
        </Field>
        <Field label="CTA URL">
          <Input {...register(`${prefix}.ctaUrl`)} />
        </Field>
      </div>
    </div>
  );
}
