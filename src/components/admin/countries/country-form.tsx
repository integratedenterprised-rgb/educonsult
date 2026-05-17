"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { Switch } from "@/components/ui/atoms/switch";
import { Textarea } from "@/components/ui/atoms/textarea";
import { MediaPicker } from "@/components/admin/media/media-picker";

import type { ContentStatus } from "@prisma/client";

const STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const satisfies readonly ContentStatus[];

interface Initial {
  code: string; slug: string;
  flagUrl: string; imageUrl: string;
  avgTuitionUsd: number | "";
  visaSuccessRate: number | "";
  popularity: number; isFeatured: boolean;
  status: ContentStatus;
  name: string; shortIntro: string; description: string;
}

interface Props { mode: "create" | "edit"; id?: string; initial?: Initial }

const EMPTY: Initial = {
  code: "", slug: "", flagUrl: "", imageUrl: "",
  avgTuitionUsd: "", visaSuccessRate: "",
  popularity: 0, isFeatured: false, status: "DRAFT",
  name: "", shortIntro: "", description: "",
};

export function CountryForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const [v, setV] = useState<Initial>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<"flag" | "image" | null>(null);

  function set<K extends keyof Initial>(key: K, val: Initial[K]) { setV((s) => ({ ...s, [key]: val })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = {
      ...v,
      avgTuitionUsd: v.avgTuitionUsd === "" ? null : Number(v.avgTuitionUsd),
      visaSuccessRate: v.visaSuccessRate === "" ? null : Number(v.visaSuccessRate),
      flagUrl: v.flagUrl || null, imageUrl: v.imageUrl || null,
    };
    const res = await fetch(mode === "create" ? "/api/admin/countries" : `/api/admin/countries/${id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) { setError(json.error?.message ?? "Save failed"); return; }
    router.push("/admin/countries"); router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country code (ISO-2)"><Input value={v.code} maxLength={2} onChange={(e) => set("code", e.target.value.toUpperCase())} required placeholder="US" /></Field>
        <Field label="Slug"><Input value={v.slug} onChange={(e) => set("slug", e.target.value)} required placeholder="united-states" /></Field>
      </div>
      <Field label="Name (English)"><Input value={v.name} onChange={(e) => set("name", e.target.value)} required /></Field>
      <Field label="Short intro"><Textarea rows={2} value={v.shortIntro} onChange={(e) => set("shortIntro", e.target.value)} /></Field>
      <Field label="Description"><Textarea rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} /></Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Flag URL">
          <div className="flex gap-2">
            <Input value={v.flagUrl} onChange={(e) => set("flagUrl", e.target.value)} placeholder="https://…" />
            <Button type="button" variant="outline" onClick={() => setPickerFor("flag")}><ImageIcon className="h-4 w-4" /></Button>
          </div>
        </Field>
        <Field label="Hero image URL">
          <div className="flex gap-2">
            <Input value={v.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
            <Button type="button" variant="outline" onClick={() => setPickerFor("image")}><ImageIcon className="h-4 w-4" /></Button>
          </div>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Avg tuition (USD)"><Input type="number" min={0} value={v.avgTuitionUsd} onChange={(e) => set("avgTuitionUsd", e.target.value === "" ? "" : Number(e.target.value))} /></Field>
        <Field label="Visa success rate (0–1)"><Input type="number" min={0} max={1} step={0.01} value={v.visaSuccessRate} onChange={(e) => set("visaSuccessRate", e.target.value === "" ? "" : Number(e.target.value))} /></Field>
        <Field label="Popularity"><Input type="number" min={0} value={v.popularity} onChange={(e) => set("popularity", Number(e.target.value))} /></Field>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <Label>Featured</Label>
        <Switch checked={v.isFeatured} onCheckedChange={(c) => set("isFeatured", c)} />
      </div>
      <Field label="Status">
        <select value={v.status} onChange={(e) => set("status", e.target.value as Initial["status"])}
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      {error && <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : mode === "create" ? "Create" : "Save"}</Button>

      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(m) => { if (pickerFor === "flag") set("flagUrl", m.url); if (pickerFor === "image") set("imageUrl", m.url); }}
        mimeStart="image/"
      />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
