"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Field } from "@/components/ui/molecules/field";
import { Switch } from "@/components/ui/atoms/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/molecules/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";
import { themeInputSchema } from "@/lib/validators/theme";
import { THEME_TOKEN_GROUPS } from "@/lib/theme";
import { slugify } from "@/lib/utils";
import { ColorTokenInput } from "./color-token-input";
import { ThemePreview } from "./theme-preview";
import type { ThemeFormValues } from "./types";
import type { ApiResponse } from "@/types/api";

interface ThemeFormProps {
  mode: "create" | "edit";
  themeId?: string;
  isDefault?: boolean;
  initialValues: ThemeFormValues;
}

export function ThemeForm({ mode, themeId, isDefault, initialValues }: ThemeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const methods = useForm<ThemeFormValues>({
    resolver: zodResolver(themeInputSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const { register, handleSubmit, watch, setValue, formState } = methods;
  const errors = formState.errors;
  const name = watch("name");
  const radius = watch("radius");
  const isDarkMode = watch("isDarkMode");
  const key = watch("key");

  async function onSubmit(values: ThemeFormValues) {
    setSaving(true);
    setError(null);
    const res = await fetch(mode === "create" ? "/api/admin/themes" : `/api/admin/themes/${themeId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as ApiResponse<{ id: string }>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    if (mode === "create") {
      router.push(`/admin/settings/theme/${json.data.id}/edit`);
    } else {
      methods.reset(values);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!themeId) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/themes/${themeId}`, { method: "DELETE" });
    const json = (await res.json()) as ApiResponse<unknown>;
    setDeleting(false);
    if (!json.ok) {
      setError(json.error.message);
      setDeleteOpen(false);
      return;
    }
    router.push("/admin/settings/theme");
    router.refresh();
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/admin/settings/theme" aria-label="Back to themes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {mode === "create" ? "New theme" : name || "Theme"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {mode === "create"
                  ? "Create a new palette."
                  : formState.isDirty
                    ? "Unsaved changes"
                    : "Changes apply to the public site instantly on save."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteOpen(true)}
                disabled={isDefault}
                title={isDefault ? "The default theme cannot be deleted" : undefined}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            ) : null}
            <Button type="submit" disabled={saving || (mode === "edit" && !formState.isDirty)}>
              {saving ? "Saving…" : mode === "create" ? "Create theme" : "Save changes"}
            </Button>
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identity</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Name" error={errors.name?.message}>
                  <Input
                    {...register("name", {
                      onBlur: (e) => {
                        if (mode === "create" && !key && e.target.value) {
                          setValue("key", slugify(e.target.value), { shouldValidate: true });
                        }
                      },
                    })}
                  />
                </Field>
                <Field
                  label="Key"
                  error={errors.key?.message}
                  hint="Stable identifier — lowercase, hyphens"
                >
                  <Input className="font-mono text-xs" {...register("key")} />
                </Field>
                <Field label="Heading font" hint="Google Fonts name">
                  <Input
                    placeholder="Inter"
                    {...register("fontHeading", { setValueAs: (v) => (v === "" ? null : v) })}
                  />
                </Field>
                <Field label="Body font" hint="Google Fonts name">
                  <Input
                    placeholder="Inter"
                    {...register("fontBody", { setValueAs: (v) => (v === "" ? null : v) })}
                  />
                </Field>
                <Field label={`Radius (${radius}rem)`} hint="Border radius for cards, buttons">
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={radius}
                    onChange={(e) =>
                      setValue("radius", Number.parseFloat(e.target.value), { shouldDirty: true })
                    }
                    className="h-9 w-full"
                  />
                </Field>
                <Field label="Dark mode" hint="Activates Tailwind's dark: variants when this theme is active">
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={(v) => setValue("isDarkMode", v, { shouldDirty: true })}
                    />
                  </div>
                </Field>
              </CardContent>
            </Card>

            {THEME_TOKEN_GROUPS.map((group) => (
              <Card key={group.label}>
                <CardHeader>
                  <CardTitle>{group.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.tokens.map((t) => (
                    <ColorTokenInput key={t.key} tokenKey={t.key} label={t.label} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <aside>
            <ThemePreview />
          </aside>
        </div>
      </form>

      {themeId ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this theme?</DialogTitle>
              <DialogDescription>
                <span className="font-medium text-foreground">{name}</span> will be removed. If it
                was active, the default theme takes over automatically.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete theme"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </FormProvider>
  );
}
