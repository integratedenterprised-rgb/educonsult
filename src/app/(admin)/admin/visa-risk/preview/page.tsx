/**
 * Admin dry-run console.
 *
 * Author fills sample fields and submits — we evaluate against the live rule
 * set without writing a lead, and render the verdict + which rules fired.
 */
import Link from "next/link";
import { Badge } from "@/components/ui/atoms/badge";
import { previewAssessment } from "@/server/visa-risk/admin.service";
import { applicantProfileSchema } from "@/lib/validators/visa-risk";
import type { ApplicantProfile } from "@/server/visa-risk/dsl";
import { requirePermission } from "@/server/auth/session";
import { RISK_LEVEL_COLORS } from "../_constants";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function PreviewPage({ searchParams }: PageProps) {
  await requirePermission("visa-risk.read");
  const sp = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const f = first(v);
    if (f !== undefined && f !== "") flat[k] = f;
  }

  const hasInput = Object.keys(flat).length > 0;

  let result: Awaited<ReturnType<typeof previewAssessment>> | null = null;
  let error: string | null = null;
  if (hasInput) {
    const parsed = applicantProfileSchema.safeParse({
      countryCode: flat.countryCode || null,
      gpa: num(flat.gpa),
      gpaScale: num(flat.gpaScale) as 4 | 10 | 100 | undefined,
      ielts: num(flat.ielts),
      toefl: num(flat.toefl),
      pte: num(flat.pte),
      duolingo: num(flat.duolingo),
      studyGapYears: num(flat.studyGapYears),
      showFundsUsd: num(flat.showFundsUsd),
      sponsorRelation: flat.sponsorRelation || null,
      fundingSource: flat.fundingSource || null,
      hasIncomeTaxReturn:
        flat.hasIncomeTaxReturn === "true"
          ? true
          : flat.hasIncomeTaxReturn === "false"
            ? false
            : undefined,
      previousVisaRefusals: num(flat.previousVisaRefusals),
      previousVisaCountry: flat.previousVisaCountry || null,
      workExperienceYears: num(flat.workExperienceYears),
      educationLevel: flat.educationLevel || null,
      age: num(flat.age),
    });

    if (!parsed.success) {
      error = parsed.error.message;
    } else {
      result = await previewAssessment(parsed.data as ApplicantProfile);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/visa-risk" className="text-xs text-muted-foreground hover:underline">
          ← Back to rules
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dry-run console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Evaluate a sample profile against the active rules. No lead is written.
        </p>
      </div>

      <form action="/admin/visa-risk/preview" className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field name="countryCode" label="Country (ISO-2)" defaultValue={flat.countryCode} placeholder="US" />
        <Field name="gpa" label="GPA" defaultValue={flat.gpa} placeholder="3.4" type="number" step="0.01" />
        <Field name="gpaScale" label="GPA scale" defaultValue={flat.gpaScale ?? "4"} type="number" />
        <Field name="ielts" label="IELTS" defaultValue={flat.ielts} type="number" step="0.5" />
        <Field name="toefl" label="TOEFL" defaultValue={flat.toefl} type="number" />
        <Field name="pte" label="PTE" defaultValue={flat.pte} type="number" />
        <Field name="duolingo" label="Duolingo" defaultValue={flat.duolingo} type="number" />
        <Field name="studyGapYears" label="Study gap (years)" defaultValue={flat.studyGapYears} type="number" />
        <Field name="showFundsUsd" label="Show funds (USD)" defaultValue={flat.showFundsUsd} type="number" />
        <SelectField
          name="sponsorRelation"
          label="Sponsor"
          defaultValue={flat.sponsorRelation}
          options={["", "self", "parent", "sibling", "agency", "other"]}
        />
        <SelectField
          name="fundingSource"
          label="Funding source"
          defaultValue={flat.fundingSource}
          options={["", "savings", "loan", "scholarship", "mixed"]}
        />
        <SelectField
          name="hasIncomeTaxReturn"
          label="Has ITR"
          defaultValue={flat.hasIncomeTaxReturn}
          options={["", "true", "false"]}
        />
        <Field name="previousVisaRefusals" label="Prior refusals" defaultValue={flat.previousVisaRefusals} type="number" />
        <Field name="previousVisaCountry" label="Refused by (ISO-2)" defaultValue={flat.previousVisaCountry} placeholder="US" />
        <Field name="workExperienceYears" label="Work exp (years)" defaultValue={flat.workExperienceYears} type="number" />
        <Field name="age" label="Age" defaultValue={flat.age} type="number" />

        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Run assessment
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={RISK_LEVEL_COLORS[result.level]}>{result.levelLabel}</Badge>
            <span className="text-2xl font-bold tabular-nums">{result.score}</span>
            <span className="text-xs text-muted-foreground">
              (raw {result.rawScore}, country ×{result.appliedWeights.country})
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{result.levelDescription}</p>

          <div>
            <h3 className="text-sm font-semibold">Triggered rules ({result.triggered.length})</h3>
            {result.triggered.length === 0 ? (
              <p className="text-xs text-muted-foreground">No rules fired for this profile.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                {result.triggered.map((t) => (
                  <li key={t.ruleId} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.key}</code>
                        <Badge className={RISK_LEVEL_COLORS[t.riskLevel]}>{t.riskLevel}</Badge>
                      </div>
                      <div className="mt-1 text-sm">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.message}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium tabular-nums">+{t.weightedScore.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">raw {t.rawScore}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold">Recommendations ({result.suggestions.length})</h3>
            {result.suggestions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No suggestions for this profile.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {result.suggestions.map((s) => (
                  <li key={s.key} className="rounded-md border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{s.severity}</Badge>
                      <Badge variant="outline">{s.category}</Badge>
                      <span className="text-sm font-medium">{s.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  type = "text",
  step,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: string[];
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}
