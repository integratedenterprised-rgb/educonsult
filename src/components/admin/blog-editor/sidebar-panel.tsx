"use client";

import { useFormContext } from "react-hook-form";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/molecules/card";
import { Field } from "@/components/ui/molecules/field";
import { Input } from "@/components/ui/atoms/input";
import { Switch } from "@/components/ui/atoms/switch";
import type { SeoScoreResult } from "@/lib/seo";
import type { PostEditorValues } from "./types";

interface Props {
  saving: boolean;
  error: string | null;
  savedAt: Date | null;
  seoScore: SeoScoreResult;
}

const STATUS_OPTIONS: Array<{ value: PostEditorValues["status"]; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export function SidebarPanel({ saving, error, savedAt, seoScore }: Props) {
  const { register, watch, setValue } = useFormContext<PostEditorValues>();
  const status = watch("status");
  const isFeatured = watch("isFeatured");

  const scoreColor =
    seoScore.score >= 80
      ? "text-emerald-600"
      : seoScore.score >= 60
        ? "text-amber-600"
        : "text-destructive";

  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Publish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Status">
            <select
              {...register("status")}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {status === "SCHEDULED" ? (
            <Field label="Scheduled for">
              <Input
                type="datetime-local"
                {...register("scheduledAt", { setValueAs: (v) => (v === "" ? null : new Date(v).toISOString()) })}
              />
            </Field>
          ) : null}
          <label className="flex items-center justify-between text-sm">
            <span>Featured</span>
            <Switch
              checked={Boolean(isFeatured)}
              onCheckedChange={(v) => setValue("isFeatured", v, { shouldDirty: true })}
            />
          </label>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {savedAt ? (
            <p className="text-xs text-muted-foreground">
              Saved at {savedAt.toLocaleTimeString()}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${scoreColor}`}>{seoScore.score}</div>
          {seoScore.issues.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {seoScore.issues.slice(0, 6).map((issue, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className={
                      issue.level === "error"
                        ? "text-destructive"
                        : issue.level === "warning"
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }
                  >
                    •
                  </span>
                  <span className="text-muted-foreground">{issue.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-emerald-600">Nice — no issues found.</p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
