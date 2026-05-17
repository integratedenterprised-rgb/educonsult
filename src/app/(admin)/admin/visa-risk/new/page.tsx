import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createRule } from "@/server/visa-risk/admin.service";
import { requirePermission } from "@/server/auth/session";
import { parseCreateFormData } from "../_form-helpers";
import { RuleForm } from "../_rule-form";

export const dynamic = "force-dynamic";

async function createRuleAction(formData: FormData) {
  "use server";
  const parsed = parseCreateFormData(formData);
  if (!parsed.ok || !parsed.data) {
    // Re-throwing surfaces the message in Next.js error UI; the dev console
    // shows the full Zod tree. Keep the message human.
    throw new Error(parsed.error ?? "Invalid input");
  }
  await createRule(parsed.data);
  revalidatePath("/admin/visa-risk");
  redirect("/admin/visa-risk");
}

export default async function NewRulePage() {
  await requirePermission("visa-risk.write");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/visa-risk" className="text-xs text-muted-foreground hover:underline">
          ← Back to rules
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New visa-risk rule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Author a predicate, set scoring, and add applicant-facing copy.
        </p>
      </div>

      <RuleForm action={createRuleAction} submitLabel="Create rule" mode="create" />
    </div>
  );
}
