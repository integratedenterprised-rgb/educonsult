"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsInputSchema, type SettingsInput } from "@/lib/validators/settings";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Field } from "@/components/ui/molecules/field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/molecules/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/organisms/tabs";
import type { ApiResponse } from "@/types/api";

export function SettingsForm({ initialValues }: { initialValues: SettingsInput }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsInputSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  async function onSubmit(values: SettingsInput) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setSavedAt(new Date());
    reset(values);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Site settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand name, contact information, and social handles displayed across the public site.
            {isDirty ? (
              <span className="ml-3 text-amber-600">Unsaved changes</span>
            ) : savedAt ? (
              <span className="ml-3">Saved {savedAt.toLocaleTimeString()}</span>
            ) : null}
          </p>
        </div>
        <Button type="submit" disabled={saving || !isDirty}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Shown in the navbar, footer, and SEO metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Site name" error={errors["site.name"]?.message}>
                <Input {...register("site.name")} />
              </Field>
              <Field
                label="Tagline"
                hint="Short one-line description used in the footer and meta description fallback"
                error={errors["site.tagline"]?.message}
              >
                <Input {...register("site.tagline")} />
              </Field>
              <Field
                label="Logo URL"
                hint="Public image URL. Leave blank to render the site name as text."
                error={errors["site.logoUrl"]?.message}
              >
                <Input placeholder="https://…" {...register("site.logoUrl")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Appears in the footer and on the contact page.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Email" error={errors["contact.email"]?.message}>
                <Input type="email" placeholder="hello@example.com" {...register("contact.email")} />
              </Field>
              <Field label="Phone" error={errors["contact.phone"]?.message}>
                <Input placeholder="+977 1 000 0000" {...register("contact.phone")} />
              </Field>
              <Field label="Address" error={errors["contact.address"]?.message}>
                <Textarea rows={3} {...register("contact.address")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social</CardTitle>
              <CardDescription>
                Profile URLs rendered as icons in the footer. Leave blank to hide.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Facebook" error={errors["social.facebook"]?.message}>
                <Input placeholder="https://facebook.com/…" {...register("social.facebook")} />
              </Field>
              <Field label="Instagram" error={errors["social.instagram"]?.message}>
                <Input placeholder="https://instagram.com/…" {...register("social.instagram")} />
              </Field>
              <Field label="LinkedIn" error={errors["social.linkedin"]?.message}>
                <Input placeholder="https://linkedin.com/…" {...register("social.linkedin")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
