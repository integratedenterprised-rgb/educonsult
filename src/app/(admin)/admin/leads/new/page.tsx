/**
 * Admin: manual lead entry.
 *
 * Counsellors who collect inquiries by phone or in-person create the record
 * here so it joins the same pipeline as form-driven leads.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/atoms/button";
import { prisma } from "@/lib/prisma";
import { createLead } from "@/server/leads/admin.service";
import { getSession } from "@/server/auth/session";
import { leadCreateSchema } from "@/lib/validators/lead";

export const dynamic = "force-dynamic";

async function createLeadAction(formData: FormData) {
  "use server";
  const parsed = leadCreateSchema.safeParse({
    source: (formData.get("source") as string) || "MANUAL_ENTRY",
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    countryCode: formData.get("countryCode") || undefined,
    preferredIntake: formData.get("preferredIntake") || undefined,
    budgetUsd: formData.get("budgetUsd") ? Number(formData.get("budgetUsd")) : undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    initialNote: formData.get("initialNote") || undefined,
  });
  if (!parsed.success) {
    return;
  }
  const session = await getSession();
  const lead = await createLead(parsed.data, session?.id ?? null);
  redirect(`/admin/leads/${lead.id}`);
}

export default async function NewLeadPage() {
  const counsellors = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null, role: { in: ["COUNSELOR", "ADMIN", "EDITOR"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/leads" className="text-xs text-muted-foreground hover:underline">
          ← Back to leads
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New lead</h1>
      </div>

      <form action={createLeadAction} className="grid max-w-3xl gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Source</span>
          <select name="source" defaultValue="MANUAL_ENTRY" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            {["MANUAL_ENTRY", "PHONE_CALL", "WALK_IN", "REFERRAL", "EVENT", "OTHER"].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">First name *</span>
          <input name="firstName" required className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Last name</span>
          <input name="lastName" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Email</span>
          <input name="email" type="email" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Phone</span>
          <input name="phone" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">WhatsApp</span>
          <input name="whatsapp" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Country (ISO-2)</span>
          <input name="countryCode" maxLength={2} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm uppercase" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Preferred intake</span>
          <input name="preferredIntake" placeholder="Fall 2026" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Budget (USD)</span>
          <input name="budgetUsd" type="number" min="0" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Assign to</span>
          <select name="assignedToId" defaultValue="" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            <option value="">— Unassigned —</option>
            {counsellors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-xs text-muted-foreground">Initial note</span>
          <textarea name="initialNote" rows={3} className="w-full rounded-md border border-input bg-background p-2 text-sm" />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit">Create lead</Button>
        </div>
      </form>
    </div>
  );
}
