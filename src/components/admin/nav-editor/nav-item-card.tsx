"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useFieldArray, useFormContext, type FieldPath } from "react-hook-form";
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
import { Switch } from "@/components/ui/atoms/switch";
import { cn } from "@/lib/utils";
import type { NavEditorFormValues, NavItemFormValue } from "./types";

type NavPath = FieldPath<NavEditorFormValues>;

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function makeEmptyItem(): NavItemFormValue {
  return {
    id: newId(),
    label: "",
    url: "",
    openInNew: false,
    isVisible: true,
    children: [],
  };
}

/**
 * Path inside the form values where this card's data lives, expressed as the
 * RHF field-array prefix for its `children` array.
 */
type ChildrenPath = `items.${number}.children` | `items.${number}.children.${number}.children`;

interface NavItemCardProps {
  /** Stable id used by dnd-kit. */
  sortableId: string;
  /** Dotted path into the form values for *this* item (e.g. "items.2.children.0"). */
  itemPath: `items.${number}` | `items.${number}.children.${number}`;
  /** Path to this item's `children` array. */
  childrenPath: ChildrenPath;
  /** Allow rendering a "+ Add submenu" button. Disabled at the second level so the tree stays one level deep. */
  allowChildren: boolean;
  onRemove: () => void;
}

export function NavItemCard({
  sortableId,
  itemPath,
  childrenPath,
  allowChildren,
  onRemove,
}: NavItemCardProps) {
  const { register, control, watch, setValue, formState } = useFormContext<NavEditorFormValues>();
  // Watching the entire children array re-renders this card whenever a child is
  // added/removed/reordered — needed so the disclosure count stays accurate.
  const children = useFieldArray({ control, name: childrenPath as never });

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: sortableId });

  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  const isVisible = watch(`${itemPath}.isVisible` as NavPath) as boolean;
  const openInNew = watch(`${itemPath}.openInNew` as NavPath) as boolean;
  const labelError = (formState.errors as Record<string, unknown>)[itemPath] as
    | { label?: { message?: string }; url?: { message?: string } }
    | undefined;

  const [expanded, setExpanded] = useState(children.fields.length > 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleChildDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = children.fields.findIndex((f) => f.id === active.id);
    const newIndex = children.fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    children.move(oldIndex, newIndex);
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "relative z-10")}>
      <div
        className={cn(
          "rounded-lg border border-border bg-card shadow-sm transition-shadow",
          isDragging && "shadow-lg ring-2 ring-primary/30",
          !isVisible && !isDragging && "opacity-60",
        )}
      >
        <div className="flex items-center gap-2 p-3">
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

          {allowChildren ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse children" : "Expand children"}
              className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : null}

          <div className="grid flex-1 gap-2 md:grid-cols-[1fr_1fr]">
            <Field label="" htmlFor={`${sortableId}-label`} error={labelError?.label?.message}>
              <Input
                id={`${sortableId}-label`}
                placeholder="Label"
                {...register(`${itemPath}.label` as NavPath)}
              />
            </Field>
            <Field label="" htmlFor={`${sortableId}-url`} error={labelError?.url?.message}>
              <Input
                id={`${sortableId}-url`}
                placeholder="URL — /about or https://…"
                className="font-mono text-xs"
                {...register(`${itemPath}.url` as NavPath)}
              />
            </Field>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setValue(`${itemPath}.isVisible` as NavPath, !isVisible, { shouldDirty: true })}
              aria-label={isVisible ? "Hide" : "Show"}
              className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              title={isVisible ? "Visible on site" : "Hidden"}
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setValue(`${itemPath}.openInNew` as NavPath, !openInNew, { shouldDirty: true })}
              aria-label={openInNew ? "Stop opening in new tab" : "Open in new tab"}
              className={cn(
                "rounded p-1 transition",
                openInNew
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              title={openInNew ? "Opens in new tab" : "Opens in same tab"}
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {allowChildren && expanded ? (
          <div className="border-t border-border bg-muted/30 px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Submenu items ({children.fields.length})
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => children.append(makeEmptyItem())}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add submenu item
              </Button>
            </div>

            {children.fields.length === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-background px-3 py-4 text-center text-xs text-muted-foreground">
                No submenu items yet.
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChildDragEnd}>
                <SortableContext
                  items={children.fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2">
                    {children.fields.map((field, i) => (
                      <li key={field.id}>
                        <ChildItem
                          sortableId={field.id}
                          itemPath={`${itemPath as `items.${number}`}.children.${i}` as `items.${number}.children.${number}`}
                          onRemove={() => children.remove(i)}
                        />
                      </li>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface ChildItemProps {
  sortableId: string;
  itemPath: `items.${number}.children.${number}`;
  onRemove: () => void;
}

function ChildItem({ sortableId, itemPath, onRemove }: ChildItemProps) {
  const { register, watch, setValue } = useFormContext<NavEditorFormValues>();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: sortableId });

  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const isVisible = watch(`${itemPath}.isVisible` as NavPath) as boolean;
  const openInNew = watch(`${itemPath}.openInNew` as NavPath) as boolean;

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
      <Input placeholder="Label" className="h-8" {...register(`${itemPath}.label` as NavPath)} />
      <Input
        placeholder="URL"
        className="h-8 font-mono text-xs"
        {...register(`${itemPath}.url` as NavPath)}
      />
      <Switch
        checked={isVisible}
        onCheckedChange={(v) => setValue(`${itemPath}.isVisible` as NavPath, v, { shouldDirty: true })}
        aria-label="Visible"
      />
      <button
        type="button"
        onClick={() => setValue(`${itemPath}.openInNew` as NavPath, !openInNew, { shouldDirty: true })}
        aria-label={openInNew ? "Stop opening in new tab" : "Open in new tab"}
        className={cn(
          "rounded p-1 transition",
          openInNew ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
        )}
        title={openInNew ? "Opens in new tab" : "Opens in same tab"}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
