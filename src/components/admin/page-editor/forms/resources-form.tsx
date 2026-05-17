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

const RESOURCE_TYPES = ["PDF", "VIDEO", "ARTICLE", "CHECKLIST", "TEMPLATE", "EXTERNAL_LINK"] as const;

export function ResourcesForm({ index }: { index: number }) {
  const { register, control, watch, setValue } = useFormContext<PageFormValues>();
  const items = useFieldArray({ control, name: `sections.${index}.data.items` as const });
  const prefix = `sections.${index}.data` as const;

  return (
    <div className="space-y-4">
      <Field label="Heading">
        <Input {...register(`${prefix}.heading`)} />
      </Field>

      <div className="space-y-3">
        {items.fields.map((field, i) => {
          const type = watch(`sections.${index}.data.items.${i}.type`) ?? "ARTICLE";
          return (
            <div key={field.id} className="space-y-3 rounded-lg border border-border bg-background p-3">
              <div className="grid gap-3 md:grid-cols-[2fr_160px_auto]">
                <Field label="Title">
                  <Input {...register(`sections.${index}.data.items.${i}.title`)} />
                </Field>
                <Field label="Type">
                  <Select
                    value={type}
                    onValueChange={(v) =>
                      setValue(
                        `sections.${index}.data.items.${i}.type`,
                        v as (typeof RESOURCE_TYPES)[number],
                        { shouldDirty: true },
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => items.remove(i)}
                  aria-label="Remove"
                  className="self-end"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Field label="Description">
                <Textarea
                  rows={2}
                  {...register(`sections.${index}.data.items.${i}.description`)}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Link / file URL">
                  <Input {...register(`sections.${index}.data.items.${i}.href`)} />
                </Field>
                <Field label="Thumbnail URL">
                  <Input {...register(`sections.${index}.data.items.${i}.thumbnailUrl`)} />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          items.append({
            title: "",
            description: "",
            type: "ARTICLE",
            href: "",
            thumbnailUrl: "",
          })
        }
      >
        <Plus className="mr-1 h-4 w-4" /> Add resource
      </Button>
    </div>
  );
}
