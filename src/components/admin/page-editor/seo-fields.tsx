"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/molecules/card";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import { SeoScorePanel } from "./seo-score-panel";
import type { PageFormValues } from "./types";

export function SeoFields() {
  const { register } = useFormContext<PageFormValues>();
  return (
    <div className="space-y-4">
      <SeoScorePanel />
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>
            Falls back to the page title and site tagline if left blank.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Meta title" hint="Up to 60 chars recommended">
            <Input {...register("seoTitle", { setValueAs: (v) => (v === "" ? null : v) })} />
          </Field>
          <Field label="Meta description" hint="Up to 160 chars recommended">
            <Textarea
              rows={3}
              {...register("seoDescription", { setValueAs: (v) => (v === "" ? null : v) })}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Keywords" hint="Comma-separated">
              <Input {...register("seoKeywords", { setValueAs: (v) => (v === "" ? null : v) })} />
            </Field>
            <Field label="OG image URL" hint="1200×630 recommended">
              <Input placeholder="https://…" {...register("ogImageUrl")} />
            </Field>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
