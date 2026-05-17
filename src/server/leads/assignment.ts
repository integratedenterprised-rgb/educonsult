/**
 * Counsellor auto-assignment.
 *
 * Strategy: round-robin among active counsellors weighted by open lead count.
 *
 *   - Eligible pool: User.role IN { COUNSELOR, ADMIN, EDITOR } AND isActive
 *     AND deletedAt = null. (Admins/editors are eligible because in small
 *     branches one person wears every hat — drop them from the pool by
 *     editing this query once you have dedicated counsellors.)
 *   - Country specialisation: if any active counsellor has handled ≥ 3 leads
 *     for the destination country in the last 90 days, the new lead is given
 *     to *one of them* before the general pool.
 *   - Tiebreak: lowest open-lead count → least-recently-assigned.
 *
 * The function is best-effort. If no counsellor is available, the lead stays
 * unassigned and shows up in the "Unassigned" admin filter.
 */
import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const OPEN_STATUSES: Prisma.LeadSubmissionWhereInput["status"] = {
  in: ["NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS"],
};
const SPECIALIST_LOOKBACK_DAYS = 90;
const SPECIALIST_MIN_LEADS = 3;

export async function autoAssignCounsellor(
  leadId: string,
  countryCode: string | null,
): Promise<string | null> {
  const eligibleIds = await listEligibleCounsellorIds();
  if (eligibleIds.length === 0) return null;

  const specialistIds = countryCode
    ? await findCountrySpecialistIds(countryCode, eligibleIds)
    : [];
  const pool = specialistIds.length > 0 ? specialistIds : eligibleIds;

  // Pick the counsellor with the lowest open caseload, breaking ties by
  // who was assigned a lead the longest time ago.
  const stats = await prisma.leadSubmission.groupBy({
    by: ["assignedToId"],
    where: {
      deletedAt: null,
      status: OPEN_STATUSES,
      assignedToId: { in: pool },
    },
    _count: { _all: true },
    _max: { assignedAt: true },
  });
  const byId = new Map(stats.map((s) => [s.assignedToId!, s]));

  const ranked = [...pool].sort((a, b) => {
    const sa = byId.get(a);
    const sb = byId.get(b);
    const ca = sa?._count._all ?? 0;
    const cb = sb?._count._all ?? 0;
    if (ca !== cb) return ca - cb;
    const ta = sa?._max.assignedAt?.getTime() ?? 0;
    const tb = sb?._max.assignedAt?.getTime() ?? 0;
    return ta - tb;
  });

  const winnerId = ranked[0];
  if (!winnerId) return null;

  await prisma.$transaction([
    prisma.leadSubmission.update({
      where: { id: leadId },
      data: { assignedToId: winnerId, assignedAt: new Date() },
    }),
    prisma.leadActivity.create({
      data: {
        leadId,
        type: "ASSIGNED",
        summary: "Auto-assigned by round-robin",
        payload: { assignedToId: winnerId, specialist: specialistIds.includes(winnerId) },
      },
    }),
  ]);
  return winnerId;
}

/** Manual reassignment used by the admin "Assign" action. */
export async function reassignLead(
  leadId: string,
  toUserId: string | null,
  actorId: string | null,
  reason: string | null,
): Promise<void> {
  const current = await prisma.leadSubmission.findUnique({
    where: { id: leadId },
    select: { assignedToId: true },
  });
  if (!current) throw new Error("LEAD_NOT_FOUND");

  await prisma.$transaction([
    prisma.leadSubmission.update({
      where: { id: leadId },
      data: { assignedToId: toUserId, assignedAt: toUserId ? new Date() : null },
    }),
    prisma.leadActivity.create({
      data: {
        leadId,
        type: toUserId ? "ASSIGNED" : "UNASSIGNED",
        summary: toUserId
          ? `Assigned${reason ? `: ${reason}` : ""}`
          : `Unassigned${reason ? `: ${reason}` : ""}`,
        payload: { from: current.assignedToId, to: toUserId, reason },
        actorId,
      },
    }),
  ]);
}

async function listEligibleCounsellorIds(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      role: { in: ["COUNSELOR", "ADMIN", "EDITOR"] },
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function findCountrySpecialistIds(
  countryCode: string,
  pool: string[],
): Promise<string[]> {
  const since = new Date(Date.now() - SPECIALIST_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const grouped = await prisma.leadSubmission.groupBy({
    by: ["assignedToId"],
    where: {
      deletedAt: null,
      countryCode,
      createdAt: { gte: since },
      assignedToId: { in: pool },
    },
    _count: { _all: true },
  });
  // Filter in JS — the `having` clause Prisma versions implement varies; doing
  // it here keeps the query portable. The result set is tiny (per-counsellor
  // counts), so the cost is negligible.
  return grouped
    .filter((g) => (g._count?._all ?? 0) >= SPECIALIST_MIN_LEADS)
    .map((g) => g.assignedToId!)
    .filter(Boolean);
}
