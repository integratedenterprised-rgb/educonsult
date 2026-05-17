"use client";

/**
 * Reusable media picker dialog. Drop into any editor where an admin needs
 * to choose an image / file URL. Returns the URL string (and optionally
 * dimensions/alt) via `onSelect`.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import type { Media } from "@prisma/client";
import { uploadFile } from "./upload-helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (media: { url: string; alt?: string | null; width?: number | null; height?: number | null }) => void;
  mimeStart?: string;
}

export function MediaPicker({ open, onClose, onSelect, mimeStart }: Props) {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (mimeStart) params.set("mime", mimeStart);
    fetch(`/api/admin/media?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled && j.ok) setItems(j.data.rows); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, q, mimeStart]);

  if (!open) return null;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        const media = await uploadFile(file, undefined);
        setItems((it) => [media, ...it]);
      } catch (e) {
        alert(`Upload failed: ${(e as Error).message}`);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-heading text-base font-semibold">Media library</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2 border-b border-border bg-background/50 px-4 py-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="max-w-xs" />
          <label className="ml-auto inline-flex cursor-pointer">
            <input type="file" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
            <span className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
              Upload
            </span>
          </label>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No media. Upload to get started.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { onSelect({ url: m.url, alt: m.alt, width: m.width, height: m.height }); onClose(); }}
                  className="group overflow-hidden rounded-lg border border-border text-left hover:border-primary"
                >
                  {m.mimeType.startsWith("image/") ? (
                    <img src={m.url} alt={m.alt ?? m.filename} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="grid aspect-square place-items-center bg-muted text-[10px] text-muted-foreground">{m.mimeType}</div>
                  )}
                  <p className="truncate px-2 py-1 text-xs">{m.filename}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
