"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { Switch } from "@/components/ui/atoms/switch";

const ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "COUNSELOR", "VIEWER"] as const;

interface Props {
  mode: "create" | "edit";
  id?: string;
  initial?: { name: string; role: (typeof ROLES)[number]; isActive: boolean };
}

export function UserForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>(initial?.role ?? "EDITOR");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = mode === "create"
      ? { email, name, password, role }
      : { name, role, isActive, ...(password ? { password } : {}) };
    const url = mode === "create" ? "/api/admin/users" : `/api/admin/users/${id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Save failed");
      return;
    }
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      {mode === "create" && (
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{mode === "create" ? "Password" : "New password (leave blank to keep)"}</Label>
        <Input id="password" type="password" minLength={8} required={mode === "create"}
               value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      {mode === "edit" && (
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <Label htmlFor="active">Active</Label>
          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      )}
      {error && (
        <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : mode === "create" ? "Create user" : "Save changes"}</Button>
    </form>
  );
}
