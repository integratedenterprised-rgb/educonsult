"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "../types";

export function CountryGridForm({ index }: { index: number }) {
  const { register, control } = useFormContext<PageFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${index}.data.countries` as const,
  });

  return (
    <div className="space-y-4">
      <Field label="Heading">
        <Input {...register(`sections.${index}.data.heading`)} />
      </Field>

      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={field.id} className="grid items-end gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Field label="Name">
              <Input {...register(`sections.${index}.data.countries.${i}.name`)} />
            </Field>
            <Field label="Flag URL">
              <Input {...register(`sections.${index}.data.countries.${i}.flagUrl`)} />
            </Field>
            <Field label="Link">
              <Input {...register(`sections.${index}.data.countries.${i}.href`)} />
            </Field>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", flagUrl: "", href: "" })}>
        <Plus className="mr-1 h-4 w-4" /> Add country
      </Button>
    </div>
  );
}
