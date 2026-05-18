"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Upload, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import type { Media } from "@prisma/client";
import { uploadFile } from "./upload-helpers";

interface Props {
  initialItems: Media[];
  initialPage: number;
  totalPages: number;
  folders: string[];
  currentFolder: string;
  currentQuery: string;
}

export function MediaLibrary({ initialItems, initialPage, totalPages, folders, currentFolder, currentQuery }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [items, setItems] = useState<Media[]>(initialItems);
  const [busy, setBusy] = useState<{ filename: string; progress: number }[]>([]);
  const [, start] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newBusy = Array.from(files).map((f) => ({ filename: f.name, progress: 0 }));
    setBusy((b) => [...b, ...newBusy]);
    for (const file of Array.from(files)) {
      try {
        const media = await uploadFile(file, currentFolder || undefined, (pct) => {
          setBusy((b) => b.map((u) => (u.filename === file.name ? { ...u, progress: pct } : u)));
        });
        setItems((it) => [media, ...it]);
      } catch (e) {
        alert(`Failed to upload ${file.name}: ${(e as Error).message}`);
      } finally {
        setBusy((b) => b.filter((u) => u.filename !== file.name));
      }
    }
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) { alert(json.error?.message); return; }
    setItems((it) => it.filter((m) => m.id !== id));
  }

  function setQuery(q: string) {
    const next = new URLSearchParams(params);
    if (q) next.set("q", q); else next.delete("q");
    next.delete("page");
    start(() => router.push(`/admin/media?${next.toString()}`));
  }

  function setFolder(folder: string) {
    const next = new URLSearchParams(params);
    if (folder) next.set("folder", folder); else next.delete("folder");
    next.delete("page");
    start(() => router.push(`/admin/media?${next.toString()}`));
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            defaultValue={currentQuery}
            placeholder="Search files…"
            className="pl-8"
            onKeyDown={(e) => { if (e.key === "Enter") setQuery((e.target as HTMLInputElement).value); }}
          />
        </div>
        <select
          value={currentFolder}
          onChange={(e) => setFolder(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All folders</option>
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="ml-auto">
          <label className="inline-flex cursor-pointer">
            <input type="file" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
            <span className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Upload className="h-4 w-4" /> Upload
            </span>
          </label>
        </div>
      </div>

      {busy.length > 0 && (
        <ul className="space-y-1 text-xs">
          {busy.map((u) => (
            <li key={u.filename} className="flex items-center gap-2">
              <span className="w-48 truncate">{u.filename}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary" style={{ width: `${u.progress}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No media yet. Upload your first file.
          </div>
        ) : items.map((m) => (
          <div key={m.id} className="group relative overflow-hidden rounded-lg border border-border bg-card">
            {m.mimeType.startsWith("image/") ? (
              <img src={m.url} alt={m.alt ?? m.filename} className="aspect-square w-full object-cover" />
            ) : (
              <div className="grid aspect-square place-items-center bg-muted text-xs text-muted-foreground">
                {m.mimeType}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
              <p className="truncate">{m.filename}</p>
              <p className="text-white/70">{Math.round(m.sizeBytes / 1024)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => remove(m.id)}
              className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition hover:bg-destructive group-hover:opacity-100"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const next = new URLSearchParams(params); next.set("page", String(p));
            return (
              <Button key={p} variant={p === initialPage ? "default" : "outline"} size="sm" asChild>
                <a href={`/admin/media?${next.toString()}`}>{p}</a>
              </Button>
            );
          })}
        </div>
      )}
    </>
  );
}
