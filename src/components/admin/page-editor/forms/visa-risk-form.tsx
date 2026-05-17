"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/molecules/select";
import type { PageFormValues } from "../types";

export function VisaRiskForm({ index }: { index: number }) {
  const { register, control, watch, setValue } = useFormContext<PageFormValues>();
  const factors = useFieldArray({ control, name: `sections.${index}.data.factors` as const });
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
        {factors.fields.map((field, i) => {
          const severity = watch(`sections.${index}.data.factors.${i}.severity`) ?? "medium";
          return (
            <div key={field.id} className="space-y-2 rounded-lg border border-border bg-background p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                <Field label="Label">
                  <Input {...register(`sections.${index}.data.factors.${i}.label`)} />
                </Field>
                <Field label="Severity">
                  <Select
                    value={severity}
                    onValueChange={(v) =>
                      setValue(`sections.${index}.data.factors.${i}.severity`, v as "low" | "medium" | "high", {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => factors.remove(i)}
                  aria-label="Remove"
                  className="self-end"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Field label="Description">
                <Textarea
                  rows={2}
                  {...register(`sections.${index}.data.factors.${i}.description`)}
                />
              </Field>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => factors.append({ label: "", description: "", severity: "medium" })}
      >
        <Plus className="mr-1 h-4 w-4" /> Add factor
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
