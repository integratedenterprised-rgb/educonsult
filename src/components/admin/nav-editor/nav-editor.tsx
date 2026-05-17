"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Plus } from "lucide-react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/atoms/button";
import { navMenuInputSchema } from "@/lib/validators/nav-menu";
import { NavItemCard, makeEmptyItem } from "./nav-item-card";
import type { NavEditorFormValues } from "./types";
import type { ApiResponse } from "@/types/api";

interface NavEditorProps {
  menuKey: string;
  location: string;
  initialValues: NavEditorFormValues;
}

export function NavEditor({ menuKey, location, initialValues }: NavEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const methods = useForm<NavEditorFormValues>({
    resolver: zodResolver(navMenuInputSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const { control, handleSubmit, reset, formState } = methods;
  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    move(oldIndex, newIndex);
  }

  async function onSubmit(values: NavEditorFormValues) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/nav/${menuKey}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setSavedAt(new Date());
    reset(values);
    router.refresh();
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Navigation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Editing menu{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{menuKey}</code>{" "}
              <span className="ml-1 text-xs uppercase tracking-wider text-muted-foreground">
                {location}
              </span>
              {formState.isDirty ? (
                <span className="ml-3 text-amber-600">Unsaved changes</span>
              ) : savedAt ? (
                <span className="ml-3">Saved {savedAt.toLocaleTimeString()}</span>
              ) : null}
            </p>
          </div>
          <Button type="submit" disabled={saving || !formState.isDirty}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <ExternalLink className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
          Use internal paths like <code className="font-mono">/about</code> for site links, or full
          <code className="font-mono"> https://</code> URLs for external destinations.
        </div>

        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">This menu has no items yet.</p>
            <Button type="button" className="mt-4" onClick={() => append(makeEmptyItem())}>
              <Plus className="mr-1 h-4 w-4" />
              Add first item
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-3">
                {fields.map((field, i) => (
                  <li key={field.id}>
                    <NavItemCard
                      sortableId={field.id}
                      itemPath={`items.${i}` as `items.${number}`}
                      childrenPath={`items.${i}.children` as `items.${number}.children`}
                      allowChildren
                      onRemove={() => remove(i)}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {fields.length > 0 ? (
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={() => append(makeEmptyItem())}>
              <Plus className="mr-1 h-4 w-4" />
              Add menu item
            </Button>
          </div>
        ) : null}
      </form>
    </FormProvider>
  );
}
