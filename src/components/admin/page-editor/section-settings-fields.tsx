"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/atoms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/molecules/select";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "./types";

interface SectionSettingsFieldsProps {
  index: number;
}

export function SectionSettingsFields({ index }: SectionSettingsFieldsProps) {
  const { register, watch, setValue } = useFormContext<PageFormValues>();
  const paddingY = watch(`sections.${index}.settings.paddingY`) ?? "md";
  const background = watch(`sections.${index}.settings.background`) ?? "default";
  const containerWidth = watch(`sections.${index}.settings.containerWidth`) ?? "default";

  return (
    <div className="grid gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 md:grid-cols-4">
      <Field label="Anchor" hint="Optional #fragment">
        <Input
          placeholder="e.g. features"
          {...register(`sections.${index}.anchor`, { setValueAs: (v) => (v === "" ? undefined : v) })}
        />
      </Field>
      <Field label="Padding">
        <Select
          value={paddingY}
          onValueChange={(v) =>
            setValue(`sections.${index}.settings.paddingY`, v as "none" | "sm" | "md" | "lg" | "xl", {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra large</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Background">
        <Select
          value={background}
          onValueChange={(v) =>
            setValue(`sections.${index}.settings.background`, v as "default" | "muted" | "primary" | "card", {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="muted">Muted</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="primary">Primary</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Container">
        <Select
          value={containerWidth}
          onValueChange={(v) =>
            setValue(`sections.${index}.settings.containerWidth`, v as "narrow" | "default" | "wide" | "full", {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="narrow">Narrow</SelectItem>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="wide">Wide</SelectItem>
            <SelectItem value="full">Full bleed</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
