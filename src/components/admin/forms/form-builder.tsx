"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { Switch } from "@/components/ui/atoms/switch";
import { Textarea } from "@/components/ui/atoms/textarea";

const FIELD_TYPES = [
  "TEXT", "EMAIL", "PHONE", "TEXTAREA", "SELECT", "MULTISELECT",
  "CHECKBOX", "RADIO", "DATE", "FILE", "HIDDEN", "COUNTRY_PICKER",
  "COURSE_PICKER", "RICH_TEXT",
] as const;
type FieldType = (typeof FIELD_TYPES)[number];

interface FieldState {
  uid: string; // client-side id for drag/key
  id?: string; // server id when persisted
  name: string;
  type: FieldType;
  isRequired: boolean;
  isVisible: boolean;
  label: string;
  placeholder: string;
  helpText: string;
  optionsText: string; // CSV — "value:label, value:label"
  validation: unknown;
  conditional: unknown;
}

interface Initial {
  key: string;
  successUrl: string; webhookUrl: string; emailTo: string;
  isActive: boolean;
  heading: string; subheading: string; submitLabel: string; successMessage: string;
  fields: Array<{
    id?: string;
    name: string; type: FieldType;
    isRequired: boolean; isVisible: boolean;
    label: string; placeholder: string; helpText: string;
    options: unknown; validation: unknown; conditional: unknown;
  }>;
}

const EMPTY: Initial = {
  key: "", successUrl: "", webhookUrl: "", emailTo: "",
  isActive: true,
  heading: "", subheading: "", submitLabel: "Submit", successMessage: "",
  fields: [],
};

function newUid() { return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2); }

function optionsToText(opts: unknown): string {
  if (!Array.isArray(opts)) return "";
  return (opts as Array<{ value: string; label: string }>).map((o) => `${o.value}:${o.label}`).join(", ");
}
function textToOptions(text: string): Array<{ value: string; label: string }> {
  return text.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const [value, label] = s.split(":").map((x) => x?.trim() ?? "");
    return { value: value || s, label: label || s };
  });
}

export function FormBuilder({ mode, id, initial }: { mode: "create" | "edit"; id?: string; initial?: Initial }) {
  const router = useRouter();
  const init = initial ?? EMPTY;

  const [key, setKey] = useState(init.key);
  const [successUrl, setSuccessUrl] = useState(init.successUrl);
  const [webhookUrl, setWebhookUrl] = useState(init.webhookUrl);
  const [emailTo, setEmailTo] = useState(init.emailTo);
  const [isActive, setIsActive] = useState(init.isActive);
  const [heading, setHeading] = useState(init.heading);
  const [subheading, setSubheading] = useState(init.subheading);
  const [submitLabel, setSubmitLabel] = useState(init.submitLabel);
  const [successMessage, setSuccessMessage] = useState(init.successMessage);

  const [fields, setFields] = useState<FieldState[]>(
    init.fields.map((f) => ({
      uid: newUid(), id: f.id, name: f.name, type: f.type,
      isRequired: f.isRequired, isVisible: f.isVisible,
      label: f.label, placeholder: f.placeholder, helpText: f.helpText,
      optionsText: optionsToText(f.options), validation: f.validation, conditional: f.conditional,
    })),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setFields((items) => {
      const oldIndex = items.findIndex((i) => i.uid === active.id);
      const newIndex = items.findIndex((i) => i.uid === over.id);
      if (oldIndex < 0 || newIndex < 0) return items;
      const next = items.slice();
      const [moved] = next.splice(oldIndex, 1);
      if (!moved) return items;
      next.splice(newIndex, 0, moved);
      return next;
    });
  }

  function updateField(uid: string, patch: Partial<FieldState>) {
    setFields((fs) => fs.map((f) => (f.uid === uid ? { ...f, ...patch } : f)));
  }
  function removeField(uid: string) { setFields((fs) => fs.filter((f) => f.uid !== uid)); }
  function addField() {
    setFields((fs) => [...fs, {
      uid: newUid(), name: `field_${fs.length + 1}`, type: "TEXT",
      isRequired: false, isVisible: true,
      label: "New field", placeholder: "", helpText: "",
      optionsText: "", validation: null, conditional: null,
    }]);
  }

  async function save() {
    setSaving(true); setError(null);
    const body = {
      key, successUrl, webhookUrl, emailTo,
      isActive, heading, subheading, submitLabel, successMessage,
      fields: fields.map((f) => ({
        id: f.id, name: f.name, type: f.type,
        isRequired: f.isRequired, isVisible: f.isVisible,
        label: f.label, placeholder: f.placeholder || null, helpText: f.helpText || null,
        options: ["SELECT", "MULTISELECT", "RADIO"].includes(f.type) ? textToOptions(f.optionsText) : null,
        validation: f.validation ?? null,
        conditional: f.conditional ?? null,
      })),
    };
    const res = await fetch(mode === "create" ? "/api/admin/forms" : `/api/admin/forms/${id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) { setError(json.error?.message ?? "Save failed"); return; }
    router.push("/admin/forms"); router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Form settings</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Key"><Input value={key} onChange={(e) => setKey(e.target.value)} required placeholder="homepage-hero" /></Field>
            <Field label="Heading"><Input value={heading} onChange={(e) => setHeading(e.target.value)} /></Field>
            <Field label="Subheading"><Input value={subheading} onChange={(e) => setSubheading(e.target.value)} /></Field>
            <Field label="Submit label"><Input value={submitLabel} onChange={(e) => setSubmitLabel(e.target.value)} /></Field>
            <Field label="Success message"><Input value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} /></Field>
            <Field label="Success URL"><Input value={successUrl} onChange={(e) => setSuccessUrl(e.target.value)} placeholder="/thank-you" /></Field>
            <Field label="Webhook URL"><Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks…" /></Field>
            <Field label="Notify email"><Input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} /></Field>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fields</h2>
            <Button type="button" variant="outline" size="sm" onClick={addField}><Plus className="mr-1 h-4 w-4" /> Add field</Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={fields.map((f) => f.uid)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {fields.length === 0 ? (
                  <li className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No fields yet. Add the first one.
                  </li>
                ) : fields.map((f) => (
                  <SortableFieldRow key={f.uid} field={f} onUpdate={(p) => updateField(f.uid, p)} onRemove={() => removeField(f.uid)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>

        {error && <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save form"}</Button>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live preview</h2>
          <div className="mt-3 space-y-3">
            {heading && <p className="text-lg font-semibold">{heading}</p>}
            {subheading && <p className="text-sm text-muted-foreground">{subheading}</p>}
            {fields.map((f) => f.isVisible && (
              <div key={f.uid} className="space-y-1">
                <label className="text-xs font-medium">{f.label}{f.isRequired && <span className="text-destructive"> *</span>}</label>
                <PreviewInput field={f} />
                {f.helpText && <p className="text-xs text-muted-foreground">{f.helpText}</p>}
              </div>
            ))}
            <Button type="button" disabled className="w-full">{submitLabel || "Submit"}</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PreviewInput({ field }: { field: FieldState }) {
  const opts = ["SELECT", "MULTISELECT", "RADIO"].includes(field.type) ? textToOptions(field.optionsText) : [];
  if (field.type === "TEXTAREA") return <Textarea rows={3} placeholder={field.placeholder} disabled />;
  if (field.type === "SELECT") return (
    <select disabled className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
      <option>{field.placeholder || "Select…"}</option>
      {opts.map((o) => <option key={o.value}>{o.label}</option>)}
    </select>
  );
  if (field.type === "RADIO") return (
    <div className="space-y-1">
      {opts.map((o) => <label key={o.value} className="flex items-center gap-2 text-xs"><input type="radio" disabled /> {o.label}</label>)}
    </div>
  );
  if (field.type === "CHECKBOX") return <label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled /> {field.label}</label>;
  return <Input placeholder={field.placeholder} disabled />;
}

function SortableFieldRow({ field, onUpdate, onRemove }: {
  field: FieldState;
  onUpdate: (patch: Partial<FieldState>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.uid });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const showOptions = ["SELECT", "MULTISELECT", "RADIO"].includes(field.type);

  return (
    <li ref={setNodeRef} style={style} className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <button type="button" {...attributes} {...listeners} className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Drag">
          <GripVertical className="h-4 w-4" />
        </button>
        <Input value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} className="flex-1" />
        <button type="button" onClick={onRemove} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Remove">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <FieldSm label="Name"><Input value={field.name} onChange={(e) => onUpdate({ name: e.target.value })} /></FieldSm>
        <FieldSm label="Type">
          <select value={field.type} onChange={(e) => onUpdate({ type: e.target.value as FieldType })} className="block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs">
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FieldSm>
        <FieldSm label="Placeholder"><Input value={field.placeholder} onChange={(e) => onUpdate({ placeholder: e.target.value })} /></FieldSm>
      </div>

      {showOptions && (
        <div className="mt-2">
          <Label className="text-xs">Options (value:label, comma-separated)</Label>
          <Input value={field.optionsText} onChange={(e) => onUpdate({ optionsText: e.target.value })}
                 placeholder="us:United States, uk:United Kingdom" />
        </div>
      )}

      <div className="mt-2">
        <Label className="text-xs">Help text</Label>
        <Input value={field.helpText} onChange={(e) => onUpdate({ helpText: e.target.value })} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={field.isRequired} onCheckedChange={(c) => onUpdate({ isRequired: c })} /> Required
        </label>
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={field.isVisible} onCheckedChange={(c) => onUpdate({ isVisible: c })} /> Visible
        </label>
      </div>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function FieldSm({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
