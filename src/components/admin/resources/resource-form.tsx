"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Image as ImageIcon, FileUp } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { Switch } from "@/components/ui/atoms/switch";
import { Textarea } from "@/components/ui/atoms/textarea";
import { MediaPicker } from "@/components/admin/media/media-picker";
import type { ContentStatus } from "@prisma/client";

const TYPES = ["PDF", "VIDEO", "ARTICLE", "CHECKLIST", "TEMPLATE", "EXTERNAL_LINK"] as const;
const STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const satisfies readonly ContentStatus[];

interface Initial {
  slug: string; type: (typeof TYPES)[number];
  fileUrl: string; externalUrl: string; thumbnailUrl: string;
  fileSize: number | ""; pageCount: number | "";
  gated: boolean; status: ContentStatus;
  title: string; description: string;
}

const EMPTY: Initial = {
  slug: "", type: "PDF",
  fileUrl: "", externalUrl: "", thumbnailUrl: "",
  fileSize: "", pageCount: "",
  gated: false, status: "DRAFT",
  title: "", description: "",
};

interface Props { mode: "create" | "edit"; id?: string; initial?: Initial }

export function ResourceForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const [v, setV] = useState<Initial>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<"file" | "thumb" | null>(null);

  function set<K extends keyof Initial>(k: K, x: Initial[K]) { setV((s) => ({ ...s, [k]: x })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const payload = {
      ...v,
      fileUrl: v.fileUrl || null,
      externalUrl: v.externalUrl || null,
      thumbnailUrl: v.thumbnailUrl || null,
      fileSize: v.fileSize === "" ? null : Number(v.fileSize),
      pageCount: v.pageCount === "" ? null : Number(v.pageCount),
      description: v.description || null,
    };
    const res = await fetch(mode === "create" ? "/api/admin/resources" : `/api/admin/resources/${id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) { setError(json.error?.message ?? "Save failed"); return; }
    router.push("/admin/resources"); router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title"><Input value={v.title} onChange={(e) => set("title", e.target.value)} required /></Field>
        <Field label="Slug"><Input value={v.slug} onChange={(e) => set("slug", e.target.value)} required /></Field>
      </div>
      <Field label="Description"><Textarea rows={3} value={v.description} onChange={(e) => set("description", e.target.value)} /></Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select value={v.type} onChange={(e) => set("type", e.target.value as Initial["type"])} className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={v.status} onChange={(e) => set("status", e.target.value as Initial["status"])} className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="File URL (stored asset)">
        <div className="flex gap-2">
          <Input value={v.fileUrl} onChange={(e) => set("fileUrl", e.target.value)} placeholder="https://…" />
          <Button type="button" variant="outline" onClick={() => setPickerFor("file")}><FileUp className="h-4 w-4" /></Button>
        </div>
      </Field>
      <Field label="External URL (off-site link)">
        <Input value={v.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="Thumbnail URL">
        <div className="flex gap-2">
          <Input value={v.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} placeholder="https://…" />
          <Button type="button" variant="outline" onClick={() => setPickerFor("thumb")}><ImageIcon className="h-4 w-4" /></Button>
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="File size (bytes)"><Input type="number" min={0} value={v.fileSize} onChange={(e) => set("fileSize", e.target.value === "" ? "" : Number(e.target.value))} /></Field>
        <Field label="Page count"><Input type="number" min={0} value={v.pageCount} onChange={(e) => set("pageCount", e.target.value === "" ? "" : Number(e.target.value))} /></Field>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <div>
          <Label>Gated download</Label>
          <p className="text-xs text-muted-foreground">Requires a lead-form submission to access.</p>
        </div>
        <Switch checked={v.gated} onCheckedChange={(c) => set("gated", c)} />
      </div>

      {error && <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : mode === "create" ? "Create" : "Save"}</Button>

      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(m) => { if (pickerFor === "file") set("fileUrl", m.url); if (pickerFor === "thumb") set("thumbnailUrl", m.url); }}
        mimeStart={pickerFor === "thumb" ? "image/" : undefined}
      />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
