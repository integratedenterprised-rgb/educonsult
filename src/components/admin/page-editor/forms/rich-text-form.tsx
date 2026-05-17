"use client";

import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PageFormValues } from "../types";

export function RichTextForm({ index }: { index: number }) {
  const { register } = useFormContext<PageFormValues>();
  return (
    <Field label="HTML content" hint="Plain HTML. Rich-text editor will replace this textarea later.">
      <Textarea rows={10} className="font-mono text-xs" {...register(`sections.${index}.data.html`)} />
    </Field>
  );
}
