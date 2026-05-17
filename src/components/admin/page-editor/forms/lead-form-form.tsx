"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "../types";

export function LeadFormForm({ index }: { index: number }) {
  const { register } = useFormContext<PageFormValues>();
  const prefix = `sections.${index}.data` as const;
  return (
    <div className="grid gap-4">
      <Field
        label="Form key"
        hint="References a `LeadForm.key` row. The form definition will be fetched at render time."
      >
        <Input placeholder="free-counseling" {...register(`${prefix}.formKey`)} />
      </Field>
      <Field label="Heading">
        <Input {...register(`${prefix}.heading`)} />
      </Field>
      <Field label="Subheading">
        <Textarea rows={2} {...register(`${prefix}.subheading`)} />
      </Field>
    </div>
  );
}
