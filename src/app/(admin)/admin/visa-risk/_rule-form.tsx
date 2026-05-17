/**
 * Shared rule-editor form. Server-rendered; the predicate is authored as JSON
 * in a monospace textarea. A field-catalog cheat sheet sits beside it so
 * authors know which keys are referenceable.
 */
import { PROFILE_FIELDS } from "@/server/visa-risk/dsl";

export interface RuleFormDefaults {
  key?: string;
  countryCode?: string | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score?: number;
  priority?: number;
  isActive?: boolean;
  condition?: unknown;
  translations?: Array<{
    locale: "EN" | "NE" | "HI" | "ZH";
    label: string;
    message: string;
    guidance?: string | null;
  }>;
}

const LOCALES = ["EN", "NE", "HI", "ZH"] as const;

const EXAMPLE_CONDITION = {
  kind: "all",
  predicates: [
    { kind: "leaf", field: "showFundsUsd", op: "gt", value: 0 },
    { kind: "leaf", field: "showFundsUsd", op: "lt", value: 15000 },
  ],
};

export function RuleForm({
  action,
  defaults = {},
  submitLabel,
  mode,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: RuleFormDefaults;
  submitLabel: string;
  mode: "create" | "edit";
}) {
  const conditionStr = defaults.condition
    ? JSON.stringify(defaults.condition, null, 2)
    : JSON.stringify(EXAMPLE_CONDITION, null, 2);

  const trByLocale = new Map((defaults.translations ?? []).map((t) => [t.locale, t]));

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {mode === "create" && (
          <label className="space-y-1 sm:col-span-2">
            <span className="block text-xs font-medium text-muted-foreground">
              Rule key (immutable) — use category.kebab-name
            </span>
            <input
              name="key"
              required
              defaultValue={defaults.key ?? ""}
              placeholder="financial.low-funds"
              className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm"
            />
          </label>
        )}

        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Country (ISO-2, blank = global)</span>
          <input
            name="countryCode"
            defaultValue={defaults.countryCode ?? ""}
            maxLength={2}
            placeholder="US"
            className="h-9 w-full rounded-md border border-input bg-background px-3 uppercase text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Risk level</span>
          <select
            name="riskLevel"
            defaultValue={defaults.riskLevel ?? "MEDIUM"}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Score (positive = adds risk)</span>
          <input
            name="score"
            type="number"
            defaultValue={defaults.score ?? 10}
            min={-50}
            max={100}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Priority (higher runs first)</span>
          <input
            name="priority"
            type="number"
            defaultValue={defaults.priority ?? 0}
            min={0}
            max={1000}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaults.isActive ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm">Active</span>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">
            Condition (JSON predicate)
          </span>
          <textarea
            name="condition"
            required
            rows={14}
            defaultValue={conditionStr}
            className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
          />
        </label>

        <aside className="rounded-md border border-border bg-muted/40 p-3 text-xs">
          <div className="font-semibold">Available fields</div>
          <ul className="mt-2 space-y-1">
            {PROFILE_FIELDS.map((f) => (
              <li key={f.key} className="flex justify-between gap-2">
                <code className="rounded bg-background px-1">{f.key}</code>
                <span className="text-muted-foreground">{f.type}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 font-semibold">Operators</div>
          <ul className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
            {["eq", "ne", "lt", "lte", "gt", "gte", "in", "between", "exists", "notExists"].map(
              (o) => (
                <li key={o}>
                  <code className="rounded bg-background px-1">{o}</code>
                </li>
              ),
            )}
          </ul>
          <div className="mt-3 font-semibold">Combinators</div>
          <ul className="mt-1 grid grid-cols-3 gap-1">
            {["all", "any", "not"].map((c) => (
              <li key={c}>
                <code className="rounded bg-background px-1">{c}</code>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="px-2 text-sm font-semibold">Translations</legend>
        <p className="text-xs text-muted-foreground">
          EN is required. Other locales fall back to EN at render time.
        </p>
        {LOCALES.map((locale) => {
          const t = trByLocale.get(locale);
          return (
            <div key={locale} className="grid gap-2 sm:grid-cols-[80px_1fr]">
              <div className="pt-2 text-xs font-medium uppercase text-muted-foreground">{locale}</div>
              <div className="grid gap-2">
                <input
                  name={`translations.${locale}.label`}
                  defaultValue={t?.label ?? ""}
                  placeholder="Short label shown in chips and breakdown"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
                <textarea
                  name={`translations.${locale}.message`}
                  defaultValue={t?.message ?? ""}
                  rows={2}
                  placeholder="Message shown to the applicant when this rule fires"
                  className="w-full rounded-md border border-input bg-background p-2 text-sm"
                />
                <textarea
                  name={`translations.${locale}.guidance`}
                  defaultValue={t?.guidance ?? ""}
                  rows={2}
                  placeholder="Remediation guidance (optional)"
                  className="w-full rounded-md border border-input bg-background p-2 text-sm"
                />
              </div>
            </div>
          );
        })}
      </fieldset>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
