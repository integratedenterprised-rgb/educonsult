"use client";

import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Field } from "@/components/ui/molecules/field";
import { cn } from "@/lib/utils";
import { LinkRow } from "./link-row";
import type { FooterEditorFormValues, FooterLinkFormValue } from "./types";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function makeEmptyLink(): FooterLinkFormValue {
  return { id: newId(), label: "", url: "", openInNew: false, isVisible: true };
}

interface ColumnCardProps {
  sortableId: string;
  columnIndex: number;
  onRemove: () => void;
}

export function ColumnCard({ sortableId, columnIndex, onRemove }: ColumnCardProps) {
  const { register, control, watch, setValue, formState } = useFormContext<FooterEditorFormValues>();
  const linksPath = `columns.${columnIndex}.links` as const;
  const links = useFieldArray({ control, name: linksPath });

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: sortableId });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  const isActive = watch(`columns.${columnIndex}.isActive` as const);
  const headingError = (formState.errors.columns as Array<{ heading?: { message?: string } }> | undefined)?.[
    columnIndex
  ]?.heading?.message;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleLinkDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.fields.findIndex((f) => f.id === active.id);
    const newIndex = links.fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    links.move(oldIndex, newIndex);
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "relative z-10")}>
      <div
        className={cn(
          "rounded-lg border border-border bg-card shadow-sm transition-shadow",
          isDragging && "shadow-lg ring-2 ring-primary/30",
          !isActive && !isDragging && "opacity-60",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 p-3">
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

          <Field label="" htmlFor={`${sortableId}-heading`} error={headingError} className="flex-1">
            <Input
              id={`${sortableId}-heading`}
              placeholder="Column heading"
              className="font-semibold"
              {...register(`columns.${columnIndex}.heading` as const)}
            />
          </Field>

          <button
            type="button"
            onClick={() =>
              setValue(`columns.${columnIndex}.isActive` as const, !isActive, { shouldDirty: true })
            }
            aria-label={isActive ? "Hide column" : "Show column"}
            className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title={isActive ? "Column visible" : "Column hidden"}
          >
            {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Delete column">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 p-3">
          {links.fields.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
              No links yet.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLinkDragEnd}>
              <SortableContext
                items={links.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {links.fields.map((field, i) => (
                    <li key={field.id}>
                      <LinkRow
                        sortableId={field.id}
                        linkPath={`${linksPath}.${i}` as `columns.${number}.links.${number}`}
                        onRemove={() => links.remove(i)}
                      />
                    </li>
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => links.append(makeEmptyLink())}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
