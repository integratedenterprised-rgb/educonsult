"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ExternalLink, Eye, EyeOff, History } from "lucide-react";
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
import { pageUpdateSchema } from "@/lib/validators/page";
import { BLOCK_META } from "./block-meta";
import { MetadataFields } from "./metadata-fields";
import { SeoFields } from "./seo-fields";
import { SectionCard } from "./section-card";
import { AddSectionMenu } from "./add-section-menu";
import type { PageFormSection, PageFormValues } from "./types";
import type { SectionType } from "@/types/cms";
import type { ApiResponse } from "@/types/api";

interface PageEditorProps {
  pageId: string;
  initialValues: PageFormValues;
  publicUrl: string;
}

function newSectionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function PageEditor({ pageId, initialValues, publicUrl }: PageEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);

  const methods = useForm<PageFormValues>({
    resolver: zodResolver(pageUpdateSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const { control, handleSubmit, reset, formState } = methods;
  const { fields, append, remove, move } = useFieldArray({ control, name: "sections" });

  // 5px activation distance: a click that doesn't move past the threshold
  // is treated as a click — so the grip handle can still receive keyboard
  // focus and the interactive controls inside the card aren't hijacked.
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

  function addSection(type: SectionType) {
    const meta = BLOCK_META[type];
    const next: PageFormSection = {
      id: newSectionId(),
      type,
      order: fields.length,
      isVisible: true,
      data: structuredClone(meta.defaultData),
    };
    append(next);
  }

  async function submitWithStatus(values: PageFormValues, overrideStatus?: PageFormValues["status"]) {
    setSaving(true);
    setError(null);
    const payload: PageFormValues = {
      ...values,
      status: overrideStatus ?? values.status,
      sections: values.sections.map((s, i) => ({ ...s, order: i })),
    };

    const res = await fetch(`/api/admin/pages/${pageId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    setSaving(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setSavedAt(new Date());
    reset(payload, { keepValues: true });
    setPreviewNonce((n) => n + 1);
    router.refresh();
  }

  async function onSubmit(values: PageFormValues) { await submitWithStatus(values); }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <header className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/admin/pages" aria-label="Back to pages">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-heading text-lg font-semibold tracking-tight">
                {initialValues.title || "Untitled page"}
              </h1>
              <p className="text-xs text-muted-foreground">
                /{initialValues.slug}{" "}
                {formState.isDirty ? (
                  <span className="ml-2 text-amber-600">Unsaved changes</span>
                ) : savedAt ? (
                  <span className="ml-2">Saved {savedAt.toLocaleTimeString()}</span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/pages/${pageId}/versions`}>
                <History className="mr-1 h-4 w-4" /> Versions
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewOpen((p) => !p)}
            >
              {previewOpen ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {previewOpen ? "Hide preview" : "Preview"}
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" />
                View
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => submitWithStatus(methods.getValues(), "DRAFT")}
            >
              {saving ? "Saving…" : "Save draft"}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => submitWithStatus(methods.getValues(), "PUBLISHED")}
            >
              {initialValues.status === "PUBLISHED" ? "Update live" : "Publish"}
            </Button>
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className={previewOpen ? "grid gap-6 lg:grid-cols-[1fr_1fr_320px]" : "grid gap-6 lg:grid-cols-[1fr_320px]"}>
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Sections
              </h2>

              {fields.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                  <p className="text-sm text-muted-foreground">This page has no sections yet.</p>
                  <div className="mt-4 inline-flex">
                    <AddSectionMenu onAdd={addSection} />
                  </div>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {fields.map((field, i) => {
                        const sectionType = (field as unknown as { type: SectionType }).type;
                        return (
                          <SectionCard
                            key={field.id}
                            fieldId={field.id}
                            index={i}
                            type={sectionType}
                            total={fields.length}
                            onMoveUp={() => i > 0 && move(i, i - 1)}
                            onMoveDown={() => i < fields.length - 1 && move(i, i + 1)}
                            onRemove={() => remove(i)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {fields.length > 0 ? (
                <div className="mt-6 flex justify-center">
                  <AddSectionMenu onAdd={addSection} />
                </div>
              ) : null}
            </section>
          </div>

          {previewOpen && (
            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live preview</span>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open in new tab ↗</a>
                </div>
                <iframe
                  key={previewNonce}
                  src={publicUrl}
                  title="Live preview"
                  className="h-[80vh] w-full bg-background"
                />
              </div>
            </aside>
          )}

          <aside className="space-y-6">
            <MetadataFields />
            <SeoFields />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
}
