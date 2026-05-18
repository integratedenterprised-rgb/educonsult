/**
 * Admin: visa-risk rule library + engine settings.
 *
 * Server-rendered listing of every rule with a quick toggle to activate /
 * deactivate. Weights + risk-level buckets are edited inline via server
 * actions — both persist into SiteSetting so the engine picks them up on the
 * next request without a redeploy.
 */
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Badge } from "@/components/ui/atoms/badge";
import {
  getBuckets,
  getWeights,
  listRules,
  setBuckets,
  setWeights,
  updateRule,
  deleteRule,
} from "@/server/visa-risk/admin.service";
import { requirePermission } from "@/server/auth/session";
import { CATEGORY_LABELS, OP_LABELS, RISK_LEVEL_COLORS } from "./_constants";
import type { Predicate } from "@/server/visa-risk/dsl";

export const dynamic = "force-dynamic";

async function toggleActiveAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";
  await updateRule(id, { isActive: !isActive });
  revalidatePath("/admin/visa-risk");
}

async function deleteRuleAction(formData: FormData) {
  "use server";
  await deleteRule(String(formData.get("id") ?? ""));
  revalidatePath("/admin/visa-risk");
}

async function saveWeightsAction(formData: FormData) {
  "use server";
  const get = (k: string) => Number(formData.get(k) ?? 1);
  await setWeights({
    academic: get("academic"),
    english: get("english"),
    study_gap: get("study_gap"),
    financial: get("financial"),
    visa_history: get("visa_history"),
    country: get("country"),
    other: get("other"),
  });
  revalidatePath("/admin/visa-risk");
}

async function saveBucketsAction(formData: FormData) {
  "use server";
  await setBuckets({
    medium: Number(formData.get("medium") ?? 20),
    high: Number(formData.get("high") ?? 45),
    critical: Number(formData.get("critical") ?? 75),
  });
  revalidatePath("/admin/visa-risk");
}

function summarizePredicate(p: Predicate): string {
  if (p.kind === "leaf") {
    const op = OP_LABELS[p.op] ?? p.op;
    if (p.op === "exists" || p.op === "notExists") return `${p.field} ${op}`;
    return `${p.field} ${op} ${JSON.stringify(p.value)}`;
  }
  if (p.kind === "not") return `NOT (${summarizePredicate(p.predicate)})`;
  const join = p.kind === "all" ? " AND " : " OR ";
  return p.predicates.map(summarizePredicate).join(join);
}

export default async function VisaRiskAdminPage() {
  await requirePermission("visa-risk.read");
  const [rules, weights, buckets] = await Promise.all([
    listRules({}),
    getWeights(),
    getBuckets(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-xs text-muted-foreground hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Visa risk engine</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit scoring rules, category weights, and risk-level thresholds. Changes take effect on the next assessment.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/visa-risk/new">
            <Plus className="mr-1 h-4 w-4" /> New rule
          </Link>
        </Button>
      </div>

      {/* Weights + buckets */}
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          action={saveWeightsAction}
          className="space-y-3 rounded-xl border border-border bg-card p-5"
        >
          <h2 className="font-semibold">Category weights</h2>
          <p className="text-xs text-muted-foreground">
            Multiplier applied to every triggered rule&apos;s score. 1.0 = use the rule&apos;s own score; 1.5 = inflate by 50%.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              ["academic", "english", "study_gap", "financial", "visa_history", "country", "other"] as const
            ).map((k) => (
              <label key={k} className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  {CATEGORY_LABELS[k]}
                </span>
                <input
                  name={k}
                  defaultValue={weights[k]}
                  type="number"
                  step="0.05"
                  min="0"
                  max="5"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
            ))}
          </div>
          <div className="pt-2">
            <Button type="submit" size="sm">
              Save weights
            </Button>
          </div>
        </form>

        <form
          action={saveBucketsAction}
          className="space-y-3 rounded-xl border border-border bg-card p-5"
        >
          <h2 className="font-semibold">Risk-level thresholds</h2>
          <p className="text-xs text-muted-foreground">
            Cumulative score must reach these values to enter the next bucket. Must satisfy medium &lt; high &lt; critical.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Medium ≥</span>
              <input
                name="medium"
                defaultValue={buckets.medium}
                type="number"
                min="1"
                max="99"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">High ≥</span>
              <input
                name="high"
                defaultValue={buckets.high}
                type="number"
                min="1"
                max="99"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Critical ≥</span>
              <input
                name="critical"
                defaultValue={buckets.critical}
                type="number"
                min="1"
                max="100"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
          </div>
          <div className="pt-2">
            <Button type="submit" size="sm">
              Save thresholds
            </Button>
          </div>
        </form>
      </div>

      {/* Rule library */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-semibold">Rule library</h2>
          <span className="text-xs text-muted-foreground">{rules.length} rules</span>
        </div>

        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {rules.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">No rules yet. Create your first one.</li>
          )}
          {rules.map((r) => {
            const en = r.translations.find((t) => t.locale === "EN") ?? r.translations[0];
            const category = (r.key.includes(".") ? r.key.split(".")[0] : "other") ?? "other";
            return (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.key}</code>
                    <Badge className={RISK_LEVEL_COLORS[r.riskLevel]}>{r.riskLevel}</Badge>
                    {r.country?.code && <Badge variant="outline">{r.country.code}</Badge>}
                    <Badge variant="outline">{CATEGORY_LABELS[category] ?? category}</Badge>
                    <span className="text-xs text-muted-foreground">score {r.score}</span>
                    <span className="text-xs text-muted-foreground">priority {r.priority}</span>
                    {!r.isActive && <Badge variant="outline">inactive</Badge>}
                  </div>
                  <div className="mt-1 text-sm font-medium">{en?.label ?? r.key}</div>
                  <div className="text-xs text-muted-foreground">{en?.message}</div>
                  <div className="mt-2 truncate font-mono text-xs text-muted-foreground">
                    {summarizePredicate(r.condition as unknown as Predicate)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={toggleActiveAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="isActive" value={String(r.isActive)} />
                    <Button type="submit" variant="outline" size="sm">
                      {r.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/visa-risk/${r.id}`}>Edit</Link>
                  </Button>
                  <form action={deleteRuleAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Test panel */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Test the engine</h2>
        <p className="text-xs text-muted-foreground">
          Open the dry-run console to evaluate a sample profile against the live rules without writing a lead.
        </p>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/visa-risk/preview">Open dry-run console</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
