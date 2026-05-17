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
  studentName: string; studentPhotoUrl: string;
  universityName: string; programName: string;
  intakeYear: number | ""; rating: number | "";
  isFeatured: boolean; countryId: string;
  status: ContentStatus;
  quote: string; studentTitle: string;
}

interface Props {
  mode: "create" | "edit"; id?: string;
  initial?: Initial;
  countries: { id: string; label: string }[];
}

const EMPTY: Initial = {
  studentName: "", studentPhotoUrl: "", universityName: "", programName: "",
  intakeYear: "", rating: 5, isFeatured: false, countryId: "", status: "DRAFT",
  quote: "", studentTitle: "",
};

export function TestimonialForm({ mode, id, initial, countries }: Props) {
  const router = useRouter();
  const [v, setV] = useState<Initial>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function set<K extends keyof Initial>(k: K, x: Initial[K]) { setV((s) => ({ ...s, [k]: x })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = {
      ...v,
      studentPhotoUrl: v.studentPhotoUrl || null,
      intakeYear: v.intakeYear === "" ? null : Number(v.intakeYear),
      rating: v.rating === "" ? null : Number(v.rating),
      countryId: v.countryId || null,
      universityName: v.universityName || null,
      programName: v.programName || null,
      studentTitle: v.studentTitle || null,
    };
    const res = await fetch(mode === "create" ? "/api/admin/testimonials" : `/api/admin/testimonials/${id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) { setError(json.error?.message ?? "Save failed"); return; }
    router.push("/admin/testimonials"); router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Field label="Student name"><Input value={v.studentName} onChange={(e) => set("studentName", e.target.value)} required /></Field>
      <Field label="Student title"><Input value={v.studentTitle} onChange={(e) => set("studentTitle", e.target.value)} placeholder="MSc CS, MIT '25" /></Field>
      <Field label="Quote"><Textarea rows={4} value={v.quote} onChange={(e) => set("quote", e.target.value)} required /></Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="University"><Input value={v.universityName} onChange={(e) => set("universityName", e.target.value)} /></Field>
        <Field label="Program"><Input value={v.programName} onChange={(e) => set("programName", e.target.value)} /></Field>
        <Field label="Intake year"><Input type="number" value={v.intakeYear} onChange={(e) => set("intakeYear", e.target.value === "" ? "" : Number(e.target.value))} /></Field>
        <Field label="Rating (1–5)"><Input type="number" min={1} max={5} value={v.rating} onChange={(e) => set("rating", e.target.value === "" ? "" : Number(e.target.value))} /></Field>
      </div>

      <Field label="Photo URL">
        <div className="flex gap-2">
          <Input value={v.studentPhotoUrl} onChange={(e) => set("studentPhotoUrl", e.target.value)} placeholder="https://…" />
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}><ImageIcon className="h-4 w-4" /></Button>
        </div>
      </Field>

      <Field label="Country">
        <select value={v.countryId} onChange={(e) => set("countryId", e.target.value)} className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="">(none)</option>
          {countries.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <Label>Featured</Label>
        <Switch checked={v.isFeatured} onCheckedChange={(c) => set("isFeatured", c)} />
      </div>

      <Field label="Status">
        <select value={v.status} onChange={(e) => set("status", e.target.value as Initial["status"])} className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      {error && <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : mode === "create" ? "Create" : "Save"}</Button>

      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(m) => set("studentPhotoUrl", m.url)} mimeStart="image/" />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
