"use client";

import { ExternalLink, GripVertical, Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Switch } from "@/components/ui/atoms/switch";
import { cn } from "@/lib/utils";
import type { FooterEditorFormValues } from "./types";

interface LinkRowProps {
  sortableId: string;
  linkPath: `columns.${number}.links.${number}`;
  onRemove: () => void;
}

export function LinkRow({ sortableId, linkPath, onRemove }: LinkRowProps) {
  const { register, watch, setValue } = useFormContext<FooterEditorFormValues>();
  const isVisible = watch(`${linkPath}.isVisible` as const);
  const openInNew = watch(`${linkPath}.openInNew` as const);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: sortableId });

  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-background p-2",
        isDragging && "relative z-10 shadow-lg ring-2 ring-primary/30",
        !isVisible && !isDragging && "opacity-60",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Input placeholder="Label" className="h-8" {...register(`${linkPath}.label` as const)} />
      <Input
        placeholder="URL"
        className="h-8 font-mono text-xs"
        {...register(`${linkPath}.url` as const)}
      />
      <Switch
        checked={isVisible}
        onCheckedChange={(v) => setValue(`${linkPath}.isVisible` as const, v, { shouldDirty: true })}
        aria-label="Visible"
      />
      <button
        type="button"
        onClick={() => setValue(`${linkPath}.openInNew` as const, !openInNew, { shouldDirty: true })}
        aria-label={openInNew ? "Stop opening in new tab" : "Open in new tab"}
        className={cn(
          "rounded p-1 transition",
          openInNew ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
        )}
        title={openInNew ? "Opens in new tab" : "Opens in same tab"}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Delete link">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
