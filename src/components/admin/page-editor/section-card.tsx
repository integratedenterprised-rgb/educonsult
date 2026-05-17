"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/molecules/card";
import { cn } from "@/lib/utils";
import { BLOCK_META } from "./block-meta";
import { SectionSettingsFields } from "./section-settings-fields";
import { SectionFormRouter } from "./section-form-router";
import type { SectionType } from "@/types/cms";
import type { PageFormValues } from "./types";

interface SectionCardProps {
  /** Stable RHF field id — also the sortable id. */
  fieldId: string;
  index: number;
  type: SectionType;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function SectionCard({
  fieldId,
  index,
  type,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: SectionCardProps) {
  const { watch, setValue } = useFormContext<PageFormValues>();
  const isVisible = watch(`sections.${index}.isVisible`) ?? true;
  const meta = BLOCK_META[type];

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "relative z-10")}>
      <Card
        className={cn(
          "transition-shadow",
          isDragging && "shadow-lg ring-2 ring-primary/30",
          !isVisible && !isDragging && "opacity-60",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2">
            <button
              ref={setActivatorNodeRef}
              type="button"
              aria-label="Drag to reorder"
              className="cursor-grab touch-none rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <CardTitle className="flex items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {meta.label}
              </span>
              <span className="text-sm font-normal text-muted-foreground">#{index + 1}</span>
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setValue(`sections.${index}.isVisible`, !isVisible, { shouldDirty: true })}
              aria-label={isVisible ? "Hide section" : "Show section"}
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={index === total - 1}
              aria-label="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Delete section">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionFormRouter type={type} index={index} />
          <SectionSettingsFields index={index} />
        </CardContent>
      </Card>
    </div>
  );
}
