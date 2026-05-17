import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRule, updateRule } from "@/server/visa-risk/admin.service";
import { requirePermission } from "@/server/auth/session";
import { parseUpdateFormData } from "../_form-helpers";
import { RuleForm, type RuleFormDefaults } from "../_rule-form";
import type { Predicate } from "@/server/visa-risk/dsl";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRulePage({ params }: PageProps) {
  await requirePermission("visa-risk.write");
  const { id } = await params;
  const rule = await getRule(id);
  if (!rule) notFound();

  async function updateRuleAction(formData: FormData) {
    "use server";
    const parsed = parseUpdateFormData(formData);
    if (!parsed.ok || !parsed.data) {
      throw new Error(parsed.error ?? "Invalid input");
    }
    await updateRule(id, parsed.data);
    revalidatePath("/admin/visa-risk");
    revalidatePath(`/admin/visa-risk/${id}`);
    redirect("/admin/visa-risk");
  }

  const defaults: RuleFormDefaults = {
    key: rule.key,
    countryCode: rule.country?.code ?? null,
    riskLevel: rule.riskLevel,
    score: rule.score,
    priority: rule.priority,
    isActive: rule.isActive,
    condition: rule.condition as unknown as Predicate,
    translations: rule.translations.map((t) => ({
      locale: t.locale,
      label: t.label,
      message: t.message,
      guidance: t.guidance,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/visa-risk" className="text-xs text-muted-foreground hover:underline">
          ← Back to rules
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Edit rule <code className="ml-2 rounded bg-muted px-1.5 py-0.5 text-base">{rule.key}</code>
        </h1>
      </div>

      <RuleForm action={updateRuleAction} defaults={defaults} submitLabel="Save changes" mode="edit" />
    </div>
  );
}
