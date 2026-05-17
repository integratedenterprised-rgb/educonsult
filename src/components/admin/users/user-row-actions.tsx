"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Edit } from "lucide-react";

export function UserRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!confirm("Delete this user? They will lose access immediately.")) return;
    setPending(true);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    setPending(false);
    if (!json.ok) {
      alert(json.error?.message ?? "Failed to delete");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/users/${id}`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit user">
        <Edit className="h-4 w-4" />
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={remove}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
        aria-label="Delete user"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
