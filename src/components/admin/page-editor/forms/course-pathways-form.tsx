"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "../types";

export function CoursePathwaysForm({ index }: { index: number }) {
  const { register, control } = useFormContext<PageFormValues>();
  const pathways = useFieldArray({ control, name: `sections.${index}.data.pathways` as const });
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
        {pathways.fields.map((field, i) => (
          <div key={field.id} className="space-y-3 rounded-lg border border-border bg-background p-3">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
              <Field label="Title">
                <Input {...register(`sections.${index}.data.pathways.${i}.title`)} />
              </Field>
              <Field label="Level">
                <Input placeholder="UG / PG / PhD" {...register(`sections.${index}.data.pathways.${i}.level`)} />
              </Field>
              <Field label="Field">
                <Input
                  placeholder="Computer Science"
                  {...register(`sections.${index}.data.pathways.${i}.field`)}
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => pathways.remove(i)}
                aria-label="Remove"
                className="self-end"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Country">
                <Input {...register(`sections.${index}.data.pathways.${i}.countryName`)} />
              </Field>
              <Field label="Duration (months)">
                <Input
                  type="number"
                  inputMode="numeric"
                  {...register(`sections.${index}.data.pathways.${i}.durationMonths`, {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
              </Field>
              <Field label="Avg. tuition (USD)">
                <Input
                  type="number"
                  inputMode="numeric"
                  {...register(`sections.${index}.data.pathways.${i}.avgTuitionUsd`, {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
              </Field>
              <Field label="Link">
                <Input {...register(`sections.${index}.data.pathways.${i}.href`)} />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          pathways.append({
            title: "",
            level: "",
            field: "",
            countryName: "",
            href: "",
          })
        }
      >
        <Plus className="mr-1 h-4 w-4" /> Add pathway
      </Button>
    </div>
  );
}
