"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function TestimonialRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Archive this testimonial?")) return;
    setPending(true);
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    const json = await res.json();
    setPending(false);
    if (!json.ok) { alert(json.error?.message); return; }
    router.refresh();
  }

  return (
    <button disabled={pending} onClick={remove} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Delete">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
