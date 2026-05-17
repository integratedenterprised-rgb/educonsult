"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "../types";

export function HeroForm({ index }: { index: number }) {
  const { register } = useFormContext<PageFormValues>();
  const prefix = `sections.${index}.data` as const;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Eyebrow" hint="Small label above the headline">
          <Input {...register(`${prefix}.eyebrow`)} />
        </Field>
        <Field label="Background image URL">
          <Input placeholder="https://…" {...register(`${prefix}.backgroundImage`)} />
        </Field>
      </div>
      <Field label="Headline">
        <Input {...register(`${prefix}.headline`)} />
      </Field>
      <Field label="Subheadline">
        <Textarea rows={2} {...register(`${prefix}.subheadline`)} />
      </Field>

      <div className="grid gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-2">
        <Field label="Primary CTA label">
          <Input {...register(`${prefix}.primaryCta.label`)} />
        </Field>
        <Field label="Primary CTA URL">
          <Input {...register(`${prefix}.primaryCta.url`)} />
        </Field>
        <Field label="Secondary CTA label">
          <Input {...register(`${prefix}.secondaryCta.label`)} />
        </Field>
        <Field label="Secondary CTA URL">
          <Input {...register(`${prefix}.secondaryCta.url`)} />
        </Field>
      </div>
    </div>
  );
}
