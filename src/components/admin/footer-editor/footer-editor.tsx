"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { footerInputSchema } from "@/lib/validators/footer";
import { ColumnCard } from "./column-card";
import type { FooterColumnFormValue, FooterEditorFormValues } from "./types";
import type { ApiResponse } from "@/types/api";

interface FooterEditorProps {
  initialValues: FooterEditorFormValues;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function makeEmptyColumn(): FooterColumnFormValue {
  const id = newId();
  return { id, key: id, heading: "", isActive: true, links: [] };
}

export function FooterEditor({ initialValues }: FooterEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const methods = useForm<FooterEditorFormValues>({
    resolver: zodResolver(footerInputSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const { control, handleSubmit, reset, formState } = methods;
  const { fields, append, remove, move } = useFieldArray({ control, name: "columns" });

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

  async function onSubmit(values: FooterEditorFormValues) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/footer", {
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
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Footer</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Columns render left-to-right on the site in the order shown here.
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

        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No footer columns yet.</p>
            <Button type="button" className="mt-4" onClick={() => append(makeEmptyColumn())}>
              <Plus className="mr-1 h-4 w-4" />
              Add first column
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-4">
                {fields.map((field, i) => (
                  <li key={field.id}>
                    <ColumnCard sortableId={field.id} columnIndex={i} onRemove={() => remove(i)} />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {fields.length > 0 ? (
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={() => append(makeEmptyColumn())}>
              <Plus className="mr-1 h-4 w-4" />
              Add column
            </Button>
          </div>
        ) : null}
      </form>
    </FormProvider>
  );
}
