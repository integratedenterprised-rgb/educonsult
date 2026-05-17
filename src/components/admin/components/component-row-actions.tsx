"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Copy, Trash2 } from "lucide-react";
import { useState } from "react";

export function ComponentRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function dup() {
    setPending(true);
    const res = await fetch(`/api/admin/components/${id}`, { method: "POST" });
    const json = await res.json();
    setPending(false);
    if (!json.ok) { alert(json.error?.message); return; }
    router.refresh();
  }
  async function remove() {
    if (!confirm("Delete this component? Existing usage will keep the cached props.")) return;
    setPending(true);
    const res = await fetch(`/api/admin/components/${id}`, { method: "DELETE" });
    const json = await res.json();
    setPending(false);
    if (!json.ok) { alert(json.error?.message); return; }
    router.refresh();
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/components/${id}`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Edit className="h-4 w-4" /></Link>
      <button disabled={pending} onClick={dup} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
      <button disabled={pending} onClick={remove} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
