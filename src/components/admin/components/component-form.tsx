"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { Switch } from "@/components/ui/atoms/switch";
import { Textarea } from "@/components/ui/atoms/textarea";

interface Initial { key: string; name: string; type: string; isReusable: boolean; propsJson: string }

interface Props { mode: "create" | "edit"; id?: string; initial?: Initial }

const EMPTY: Initial = { key: "", name: "", type: "", isReusable: true, propsJson: "{}" };

export function ComponentForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const [v, setV] = useState<Initial>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Initial>(k: K, x: Initial[K]) { setV((s) => ({ ...s, [k]: x })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    let props: unknown;
    try { props = JSON.parse(v.propsJson || "{}"); }
    catch { setSaving(false); setError("Props is not valid JSON"); return; }
    const res = await fetch(mode === "create" ? "/api/admin/components" : `/api/admin/components/${id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: v.key, name: v.name, type: v.type, isReusable: v.isReusable, props }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) { setError(json.error?.message ?? "Save failed"); return; }
    router.push("/admin/components"); router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><Input value={v.name} onChange={(e) => set("name", e.target.value)} required /></Field>
        <Field label="Key"><Input value={v.key} onChange={(e) => set("key", e.target.value)} required placeholder="feature-tile" /></Field>
      </div>
      <Field label="Type (renderer key)">
        <Input value={v.type} onChange={(e) => set("type", e.target.value)} required placeholder="feature-tile" />
      </Field>
      <Field label="Default props (JSON)">
        <Textarea rows={10} value={v.propsJson} onChange={(e) => set("propsJson", e.target.value)} className="font-mono text-xs" />
      </Field>
      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <Label>Reusable in page builder</Label>
        <Switch checked={v.isReusable} onCheckedChange={(c) => set("isReusable", c)} />
      </div>
      {error && <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : mode === "create" ? "Create" : "Save"}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
