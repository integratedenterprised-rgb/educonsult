"use client";

import { useFormContext, type FieldErrors } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/molecules/card";
import { Input } from "@/components/ui/atoms/input";
import { Field } from "@/components/ui/molecules/field";
import { Switch } from "@/components/ui/atoms/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/molecules/select";
import type { PageFormValues } from "./types";

export function MetadataFields() {
  const { register, watch, setValue, formState } = useFormContext<PageFormValues>();
  const errors = formState.errors as FieldErrors<PageFormValues>;
  const status = watch("status");
  const isHomepage = watch("isHomepage");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page settings</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Title" htmlFor="title" error={errors.title?.message} className="md:col-span-2">
          <Input id="title" {...register("title")} />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          error={errors.slug?.message}
          hint="URL path — lowercase, dashes, optional nested with '/'"
        >
          <Input id="slug" {...register("slug")} />
        </Field>

        <Field label="Template" htmlFor="template" hint="Optional renderer hint">
          <Input
            id="template"
            placeholder="home, landing, country…"
            {...register("template", { setValueAs: (v) => (v === "" ? null : v) })}
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <Select value={status} onValueChange={(v) => setValue("status", v as PageFormValues["status"], { shouldDirty: true })}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Homepage" hint="Only one page can be the homepage at a time">
          <div className="flex h-9 items-center">
            <Switch
              checked={isHomepage}
              onCheckedChange={(v) => setValue("isHomepage", v, { shouldDirty: true })}
            />
          </div>
        </Field>
      </CardContent>
    </Card>
  );
}
