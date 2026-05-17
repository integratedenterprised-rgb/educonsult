"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function SeoImportForm() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file) {
      setMsg("Pick a CSV first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/analytics/seo/import", { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: { inserted: number; pages: number }; error?: { message: string } };
    setBusy(false);
    if (data.ok) {
      setMsg(`Imported ${data.data?.inserted ?? 0} rows, ${data.data?.pages ?? 0} page-days.`);
      router.refresh();
    } else {
      setMsg(data.error?.message ?? "Import failed.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        className="block text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Import CSV"}
      </button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </form>
  );
}
