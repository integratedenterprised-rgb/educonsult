/**
 * Admin: lead tags.
 *
 * Tiny page for editing the label library. Used to tag leads with
 * persona/topic/intent indicators (e.g. "scholarship-applicant", "stem-only").
 */
import Link from "next/link";
import { listTags, upsertTag, deleteTag } from "@/server/leads/admin.service";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/atoms/button";
import { requirePermission } from "@/server/auth/session";

export const dynamic = "force-dynamic";

async function saveTagAction(formData: FormData) {
  "use server";
  await upsertTag({
    slug: String(formData.get("slug") ?? ""),
    label: String(formData.get("label") ?? ""),
    color: (formData.get("color") as string) || null,
  });
  revalidatePath("/admin/leads/tags");
}

async function deleteTagAction(formData: FormData) {
  "use server";
  await deleteTag(String(formData.get("id") ?? ""));
  revalidatePath("/admin/leads/tags");
}

export default async function LeadTagsPage() {
  await requirePermission("leads.write");
  const tags = await listTags();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/leads" className="text-xs text-muted-foreground hover:underline">
          ← Back to leads
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Lead tags</h1>
        <p className="text-sm text-muted-foreground">Persona / intent labels shared across all leads.</p>
      </div>

      <form action={saveTagAction} className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_120px_auto]">
        <input name="slug" required placeholder="slug (kebab-case)" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        <input name="label" required placeholder="Display label" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        <input name="color" placeholder="#hex" className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        <Button type="submit">Save tag</Button>
      </form>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {tags.length === 0 && <li className="p-4 text-sm text-muted-foreground">No tags yet.</li>}
        {tags.map((t) => (
          <li key={t.id} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-4 w-4 rounded-full border"
                style={{ background: t.color ?? "transparent" }}
              />
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.slug}</div>
              </div>
            </div>
            <form action={deleteTagAction}>
              <input type="hidden" name="id" value={t.id} />
              <Button type="submit" variant="ghost" size="sm">
                Delete
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
