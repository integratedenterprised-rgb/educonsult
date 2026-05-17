"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";

export function ResourceRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function remove() {
    if (!confirm("Archive this resource?")) return;
    setPending(true);
    const res = await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
    const json = await res.json();
    setPending(false);
    if (!json.ok) { alert(json.error?.message); return; }
    router.refresh();
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/resources/${id}`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Edit className="h-4 w-4" /></Link>
      <button disabled={pending} onClick={remove} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
