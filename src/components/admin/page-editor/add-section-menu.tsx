"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import type { SectionType } from "@/types/cms";
import { BLOCK_META, BLOCK_TYPES } from "./block-meta";
import { cn } from "@/lib/utils";

export function AddSectionMenu({ onAdd }: { onAdd: (type: SectionType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Plus className="mr-1 h-4 w-4" />
        Add section
      </Button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={cn(
              "absolute left-0 z-20 mt-2 w-72 rounded-lg border border-border bg-popover p-2 shadow-md",
            )}
          >
            <ul className="grid gap-1">
              {BLOCK_TYPES.map((t) => {
                const meta = BLOCK_META[t];
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => {
                        onAdd(t);
                        setOpen(false);
                      }}
                      className="w-full rounded-md p-2 text-left transition hover:bg-accent"
                    >
                      <div className="text-sm font-medium text-popover-foreground">{meta.label}</div>
                      <div className="text-xs text-muted-foreground">{meta.description}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
