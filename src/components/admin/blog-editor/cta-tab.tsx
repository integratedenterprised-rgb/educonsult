"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/molecules/card";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import type { PostEditorValues } from "./types";

const PLACEMENTS: Array<{ value: string; label: string }> = [
  { value: "AFTER_INTRO", label: "After intro paragraph" },
  { value: "AFTER_HEADING", label: "After heading id…" },
  { value: "AFTER_PARAGRAPH", label: "After the Nth paragraph" },
  { value: "END_OF_POST", label: "End of post" },
  { value: "SIDEBAR", label: "Sidebar" },
];

const VARIANTS: Array<{ value: string; label: string }> = [
  { value: "CARD", label: "Card" },
  { value: "INLINE", label: "Inline" },
  { value: "BANNER", label: "Banner" },
  { value: "LEAD_FORM", label: "Lead form" },
];

export function CtaTab() {
  const { register, control, watch } = useFormContext<PostEditorValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "ctaSlots" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call-to-action slots</CardTitle>
        <CardDescription>
          Inject CTAs at chosen anchors without editing the body. Visibility can be toggled per CTA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No CTAs configured.
          </p>
        ) : (
          fields.map((field, i) => {
            const placement = watch(`ctaSlots.${i}.placement` as const);
            const variant = watch(`ctaSlots.${i}.variant` as const);
            return (
              <div key={field.id} className="space-y-3 rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <Field label="Heading" className="flex-1">
                    <Input {...register(`ctaSlots.${i}.heading` as const)} />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(i)}
                    aria-label="Remove"
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Field label="Body">
                  <Textarea
                    rows={2}
                    {...register(`ctaSlots.${i}.body` as const, {
                      setValueAs: (v) => (v === "" ? null : v),
                    })}
                  />
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Placement">
                    <select
                      {...register(`ctaSlots.${i}.placement` as const)}
                      className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {PLACEMENTS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Variant">
                    <select
                      {...register(`ctaSlots.${i}.variant` as const)}
                      className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {VARIANTS.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {placement === "AFTER_HEADING" ? (
                  <Field label="Heading anchor (id)" hint="Matches the H2/H3 id in the body">
                    <Input {...register(`ctaSlots.${i}.anchor` as const, { setValueAs: (v) => (v === "" ? null : v) })} />
                  </Field>
                ) : null}
                {placement === "AFTER_PARAGRAPH" ? (
                  <Field label="Paragraph index" hint="0-based — 0 inserts after the first paragraph">
                    <Input
                      type="number"
                      min={0}
                      {...register(`ctaSlots.${i}.paragraphIndex` as const, {
                        setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
                      })}
                    />
                  </Field>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Primary label">
                    <Input {...register(`ctaSlots.${i}.primaryLabel` as const, { setValueAs: (v) => (v === "" ? null : v) })} />
                  </Field>
                  <Field label="Primary URL">
                    <Input {...register(`ctaSlots.${i}.primaryUrl` as const, { setValueAs: (v) => (v === "" ? null : v) })} />
                  </Field>
                  <Field label="Secondary label">
                    <Input {...register(`ctaSlots.${i}.secondaryLabel` as const, { setValueAs: (v) => (v === "" ? null : v) })} />
                  </Field>
                  <Field label="Secondary URL">
                    <Input {...register(`ctaSlots.${i}.secondaryUrl` as const, { setValueAs: (v) => (v === "" ? null : v) })} />
                  </Field>
                </div>

                {variant === "LEAD_FORM" ? (
                  <Field label="Lead-form key" hint="From the LeadForm table">
                    <Input {...register(`ctaSlots.${i}.formKey` as const, { setValueAs: (v) => (v === "" ? null : v) })} />
                  </Field>
                ) : null}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...register(`ctaSlots.${i}.isVisible` as const)} />
                    Visible
                  </label>
                  <input type="hidden" {...register(`ctaSlots.${i}.order` as const, { valueAsNumber: true })} value={i} />
                </div>
              </div>
            );
          })
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              placement: "END_OF_POST",
              variant: "CARD",
              anchor: null,
              paragraphIndex: null,
              heading: "",
              body: null,
              primaryLabel: null,
              primaryUrl: null,
              secondaryLabel: null,
              secondaryUrl: null,
              formKey: null,
              backgroundImage: null,
              isVisible: true,
              order: fields.length,
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" /> Add CTA
        </Button>
      </CardContent>
    </Card>
  );
}
