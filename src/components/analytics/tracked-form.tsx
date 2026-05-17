"use client";

/**
 * Form tracking wrapper.
 *
 * Mounts an IntersectionObserver to fire `FORM_VIEW` once the form scrolls
 * into the viewport, then `FORM_START` on first interaction with any field.
 * Submit/error are emitted by the form's own handlers via `useFormTracker`.
 *
 * Drop this around the existing form markup; no change to the form library
 * needed:
 *
 *   <TrackedForm formId={form.id} formKey={form.key}>
 *     <FormRenderer ... />
 *   </TrackedForm>
 */
import * as React from "react";
import { track } from "@/lib/analytics/client";

interface Props {
  formId: string;
  formKey?: string;
  children: React.ReactNode;
  className?: string;
}

export function TrackedForm({ formId, formKey, children, className }: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const started = React.useRef(false);
  const viewed = React.useRef(false);

  React.useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !viewed.current) {
            viewed.current = true;
            track("FORM_VIEW", { formId, properties: { formKey } });
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [formId, formKey]);

  const onFirstInteraction = (e: React.SyntheticEvent) => {
    if (started.current) return;
    const target = e.target as HTMLElement;
    if (!target.matches?.("input, select, textarea")) return;
    started.current = true;
    track("FORM_START", { formId, fieldName: (target as HTMLInputElement).name || undefined });
  };

  return (
    <div
      ref={ref}
      onFocusCapture={onFirstInteraction}
      onChangeCapture={onFirstInteraction}
      className={className}
      data-form-id={formId}
    >
      {children}
    </div>
  );
}

/**
 * Hook for form submission handlers. Call `onSubmit()` right before posting,
 * `onSuccess()` after a 2xx response, `onError()` on rejection.
 */
export function useFormTracker(formId: string, formKey?: string) {
  return React.useMemo(
    () => ({
      onSubmit: (extras?: Record<string, unknown>) =>
        track("FORM_SUBMIT", { formId, properties: { formKey, ...extras } }),
      onSuccess: (extras?: Record<string, unknown>) =>
        track("FORM_SUCCESS", { formId, properties: { formKey, ...extras } }),
      onError: (message: string, fieldName?: string) =>
        track("FORM_ERROR", { formId, fieldName, errorMessage: message, properties: { formKey } }),
      onAbandon: (lastFieldName?: string) =>
        track("FORM_ABANDONED", { formId, fieldName: lastFieldName, properties: { formKey } }),
      onStepComplete: (step: number) =>
        track("FORM_STEP_COMPLETE", { formId, formStep: step, properties: { formKey } }),
    }),
    [formId, formKey],
  );
}
