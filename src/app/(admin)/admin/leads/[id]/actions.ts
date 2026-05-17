"use server";

/**
 * Server actions for the lead detail page.
 *
 * Each action validates input, calls the service, and revalidates the lead
 * detail path so the page renders the new state. We rely on `requireAdmin()`
 * in the service entry points to enforce auth — the actions themselves only
 * pass through the session user id.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addFollowUp,
  addNote,
  changeStatus,
  setLeadTags,
  updateFollowUp,
} from "@/server/leads/admin.service";
import { reassignLead } from "@/server/leads/assignment";
import { dispatchLeadNotifications } from "@/server/leads/notifications";
import { getSession } from "@/server/auth/session";
import {
  leadAssignSchema,
  leadFollowUpCreateSchema,
  leadFollowUpUpdateSchema,
  leadNoteCreateSchema,
  leadStatusChangeSchema,
  leadTagsSetSchema,
} from "@/lib/validators/lead";

async function actorId(): Promise<string | null> {
  const s = await getSession();
  return s?.id ?? null;
}

export async function addNoteAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const parsed = leadNoteCreateSchema.safeParse({
    body: formData.get("body"),
    isPinned: formData.get("isPinned") === "true",
  });
  if (!parsed.success) return;
  await addNote(leadId, parsed.data, await actorId());
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function addFollowUpAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const parsed = leadFollowUpCreateSchema.safeParse({
    channel: formData.get("channel"),
    dueAt: formData.get("dueAt"),
    notes: formData.get("notes") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
  });
  if (!parsed.success) return;
  await addFollowUp(leadId, parsed.data, await actorId());
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function completeFollowUpAction(formData: FormData) {
  const followUpId = String(formData.get("followUpId") ?? "");
  const parsed = leadFollowUpUpdateSchema.safeParse({
    status: "COMPLETED",
    outcome: formData.get("outcome") || undefined,
  });
  if (!parsed.success) return;
  const updated = await updateFollowUp(followUpId, parsed.data, await actorId());
  revalidatePath(`/admin/leads/${updated.leadId}`);
}

export async function changeStatusAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const parsed = leadStatusChangeSchema.safeParse({
    status: formData.get("status") || undefined,
    closeReason: formData.get("closeReason") || undefined,
  });
  if (!parsed.success) return;
  await changeStatus(leadId, parsed.data, await actorId());
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function changeStageAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const parsed = leadStatusChangeSchema.safeParse({
    stage: formData.get("stage") || undefined,
  });
  if (!parsed.success) return;
  await changeStatus(leadId, parsed.data, await actorId());
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function assignAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const parsed = leadAssignSchema.safeParse({
    assignedToId: formData.get("assignedToId") || null,
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return;
  const aid = await actorId();
  await reassignLead(leadId, parsed.data.assignedToId, aid, parsed.data.reason ?? null);
  if (parsed.data.assignedToId) {
    void dispatchLeadNotifications({ leadId, kind: "assigned", actorId: aid });
  }
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function setTagsAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const tagIds = formData.getAll("tagIds").map(String).filter(Boolean);
  const parsed = leadTagsSetSchema.safeParse({ tagIds });
  if (!parsed.success) return;
  await setLeadTags(leadId, parsed.data.tagIds, await actorId());
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function deleteLeadAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const { prisma } = await import("@/lib/prisma");
  await prisma.leadSubmission.update({ where: { id: leadId }, data: { deletedAt: new Date() } });
  redirect("/admin/leads");
}
