/**
 * Admin lead service.
 *
 * Covers everything the CRM screens need:
 *   - listLeads        — filter, search, paginate, sort
 *   - getLead          — full detail with timeline, notes, follow-ups, messages
 *   - createLead       — manual entry (admin-side; bypasses public scoring rules
 *                        but still scores so the dashboard sees a number)
 *   - updateLead       — partial update + activity log
 *   - changeStatus     — status/stage move with closeReason support
 *   - addNote          — pinned/unpinned freeform note
 *   - addFollowUp      — schedule outreach
 *   - completeFollowUp — close the loop on a scheduled follow-up
 *   - setTags          — replace the lead's tag set
 *   - bulkAction       — assign / status / stage / tag / delete on N rows
 *   - exportCsv        — RFC-4180 export of the current filter set
 *   - analyticsSummary — counts, funnel, source mix, time-to-contact
 *
 * Every write that changes shape adds a `LeadActivity` row so the timeline is
 * a complete audit of what happened.
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scoreLead } from "./scoring";
import { reassignLead } from "./assignment";
import { dispatchLeadNotifications } from "./notifications";
import { recordServerEvent } from "@/server/analytics/events.service";
import type {
  LeadCreateInput,
  LeadUpdateInput,
  LeadStatusChangeInput,
  LeadNoteCreateInput,
  LeadFollowUpCreateInput,
  LeadFollowUpUpdateInput,
  LeadBulkActionInput,
  LeadListQuery,
  LeadTagUpsertInput,
} from "@/lib/validators/lead";

// ── List ───────────────────────────────────────────────────────────────────

export async function listLeads(params: LeadListQuery) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 25));
  const sort = params.sort ?? "createdAt";
  const order = params.order ?? "desc";

  const where: Prisma.LeadSubmissionWhereInput = {
    deletedAt: null,
    ...(params.source ? { source: params.source } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.stage ? { stage: params.stage } : {}),
    ...(params.temperature ? { temperature: params.temperature } : {}),
    ...(params.priority ? { priority: params.priority } : {}),
    ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
    ...(params.unassigned ? { assignedToId: null } : {}),
    ...(params.countryCode ? { countryCode: params.countryCode.toUpperCase() } : {}),
    ...(params.tagId ? { tags: { some: { tagId: params.tagId } } } : {}),
    ...(params.overdueFollowUp
      ? { nextFollowUpAt: { not: null, lt: new Date() } }
      : {}),
    ...(params.createdFrom || params.createdTo
      ? {
          createdAt: {
            ...(params.createdFrom ? { gte: params.createdFrom } : {}),
            ...(params.createdTo ? { lte: params.createdTo } : {}),
          },
        }
      : {}),
    ...buildSearch(params.query),
  };

  const [rows, total] = await Promise.all([
    prisma.leadSubmission.findMany({
      where,
      orderBy: { [sort]: order } as Prisma.LeadSubmissionOrderByWithRelationInput,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: leadListSelect,
    }),
    prisma.leadSubmission.count({ where }),
  ]);

  return {
    rows,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

const leadListSelect = {
  id: true,
  source: true,
  fullName: true,
  email: true,
  phone: true,
  countryCode: true,
  status: true,
  stage: true,
  temperature: true,
  priority: true,
  score: true,
  assignedToId: true,
  assignedTo: { select: { id: true, name: true, email: true } },
  lastContactedAt: true,
  nextFollowUpAt: true,
  createdAt: true,
  updatedAt: true,
  tags: { select: { tag: { select: { id: true, slug: true, label: true, color: true } } } },
} satisfies Prisma.LeadSubmissionSelect;

function buildSearch(query?: string): Prisma.LeadSubmissionWhereInput {
  const q = query?.trim();
  if (!q) return {};
  return {
    OR: [
      { fullName: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q, mode: "insensitive" } },
    ],
  };
}

// ── Detail ─────────────────────────────────────────────────────────────────

export async function getLead(id: string) {
  return prisma.leadSubmission.findFirst({
    where: { id, deletedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      form: { select: { id: true, key: true } },
      resource: { select: { id: true, slug: true, translations: { select: { locale: true, title: true } } } },
      tags: { include: { tag: true } },
      notes: {
        where: { deletedAt: null },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: { author: { select: { id: true, name: true } } },
      },
      followUps: {
        orderBy: { dueAt: "asc" },
        include: {
          assignedTo: { select: { id: true, name: true } },
          completedBy: { select: { id: true, name: true } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { actor: { select: { id: true, name: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

// ── Create / Update ────────────────────────────────────────────────────────

export async function createLead(input: LeadCreateInput, actorId: string | null) {
  const scoring = scoreLead({
    source: input.source,
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    countryCode: input.countryCode,
    preferredIntake: input.preferredIntake,
    budgetUsd: input.budgetUsd,
    ielts: input.ielts,
    gpa: input.gpa,
  });
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(" ").trim() || null;

  return prisma.$transaction(async (tx) => {
    const lead = await tx.leadSubmission.create({
      data: {
        source: input.source,
        data: (input.data ?? {}) as Prisma.InputJsonValue,
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        fullName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        countryCode: input.countryCode ?? null,
        preferredIntake: input.preferredIntake ?? null,
        budgetUsd: input.budgetUsd ?? null,
        ielts: input.ielts ?? null,
        gpa: input.gpa ?? null,
        assignedToId: input.assignedToId ?? null,
        assignedAt: input.assignedToId ? new Date() : null,
        priority: input.priority ?? scoring.priority,
        score: scoring.score,
        scoreBreakdown: scoring.breakdown as unknown as Prisma.InputJsonValue,
        temperature: scoring.temperature,
        status: "NEW",
        stage: "NEW",
      },
    });

    await tx.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "CREATED",
        summary: "Created manually",
        actorId,
        payload: { score: scoring.score, temperature: scoring.temperature } as Prisma.InputJsonValue,
      },
    });

    if (input.initialNote) {
      await tx.leadNote.create({
        data: { leadId: lead.id, body: input.initialNote, authorId: actorId },
      });
    }
    if (input.tagIds && input.tagIds.length > 0) {
      await tx.leadTagOnLead.createMany({
        data: input.tagIds.map((tagId) => ({ leadId: lead.id, tagId })),
        skipDuplicates: true,
      });
    }
    return lead;
  });
}

export async function updateLead(id: string, input: LeadUpdateInput, actorId: string | null) {
  const before = await prisma.leadSubmission.findUnique({
    where: { id },
    select: { status: true, stage: true, assignedToId: true, score: true, temperature: true, priority: true },
  });
  if (!before) throw new Error("LEAD_NOT_FOUND");

  const fullName =
    input.firstName !== undefined || input.lastName !== undefined
      ? [input.firstName, input.lastName].filter(Boolean).join(" ").trim() || null
      : undefined;

  // Atomic write: if the activity insert fails, the lead update must roll
  // back too. Otherwise we get untraceable lead mutations with no audit row.
  const lead = await prisma.$transaction(async (tx) => {
    const updated = await tx.leadSubmission.update({
      where: { id },
      data: {
        firstName: input.firstName ?? undefined,
        lastName: input.lastName ?? undefined,
        ...(fullName !== undefined ? { fullName } : {}),
        email: input.email ?? undefined,
        phone: input.phone ?? undefined,
        whatsapp: input.whatsapp ?? undefined,
        countryCode: input.countryCode ?? undefined,
        preferredIntake: input.preferredIntake ?? undefined,
        budgetUsd: input.budgetUsd ?? undefined,
        ielts: input.ielts ?? undefined,
        gpa: input.gpa ?? undefined,
        priority: input.priority ?? undefined,
        temperature: input.temperature ?? undefined,
        status: input.status ?? undefined,
        stage: input.stage ?? undefined,
        closeReason: input.closeReason ?? undefined,
        ...(input.status && ["WON", "LOST"].includes(input.status) ? { closedAt: new Date() } : {}),
      },
    });
    await tx.leadActivity.create({
      data: {
        leadId: id,
        type: "CUSTOM",
        summary: "Lead updated",
        payload: diffPayload(before, updated),
        actorId,
      },
    });
    return updated;
  });

  return lead;
}

function diffPayload(before: Record<string, unknown>, after: Record<string, unknown>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(before)) {
    if (before[key] !== after[key]) changes[key] = { from: before[key], to: after[key] };
  }
  return changes as Prisma.InputJsonValue;
}

// ── Status / stage transitions ─────────────────────────────────────────────

export async function changeStatus(
  id: string,
  input: LeadStatusChangeInput,
  actorId: string | null,
) {
  const current = await prisma.leadSubmission.findUnique({
    where: { id },
    select: { status: true, stage: true },
  });
  if (!current) throw new Error("LEAD_NOT_FOUND");

  const data: Prisma.LeadSubmissionUpdateInput = {};
  const activities: Prisma.LeadActivityCreateManyInput[] = [];

  if (input.status && input.status !== current.status) {
    data.status = input.status;
    if (input.status === "WON" || input.status === "LOST") data.closedAt = new Date();
    if (input.closeReason) data.closeReason = input.closeReason;
    activities.push({
      leadId: id,
      type: "STATUS_CHANGED",
      summary: `Status: ${current.status} → ${input.status}`,
      payload: { from: current.status, to: input.status, reason: input.closeReason ?? null } as Prisma.InputJsonValue,
      actorId,
    });
  }
  if (input.stage && input.stage !== current.stage) {
    data.stage = input.stage;
    activities.push({
      leadId: id,
      type: "STAGE_CHANGED",
      summary: `Stage: ${current.stage} → ${input.stage}`,
      payload: { from: current.stage, to: input.stage } as Prisma.InputJsonValue,
      actorId,
    });
  }
  if (activities.length === 0) return prisma.leadSubmission.findUnique({ where: { id } });

  const [lead] = await prisma.$transaction([
    prisma.leadSubmission.update({ where: { id }, data }),
    prisma.leadActivity.createMany({ data: activities }),
  ]);

  // Notify on terminal state changes.
  if (input.status === "WON" || input.status === "LOST") {
    void dispatchLeadNotifications({ leadId: id, kind: "status", actorId });
  }

  // Mirror status/stage transitions into analytics. Terminal states get
  // their own event types so funnels can pin on them.
  if (input.status && input.status !== current.status) {
    void recordServerEvent({
      type:
        input.status === "WON"
          ? "LEAD_WON"
          : input.status === "LOST"
            ? "LEAD_LOST"
            : "LEAD_STATUS_CHANGED",
      leadId: id,
      userId: actorId ?? undefined,
      properties: { from: current.status, to: input.status, reason: input.closeReason ?? null },
    });
  }
  if (input.stage && input.stage !== current.stage) {
    void recordServerEvent({
      type: "LEAD_STAGE_CHANGED",
      leadId: id,
      userId: actorId ?? undefined,
      properties: { from: current.stage, to: input.stage },
    });
  }
  return lead;
}

// ── Notes ──────────────────────────────────────────────────────────────────

export async function addNote(leadId: string, input: LeadNoteCreateInput, actorId: string | null) {
  const [note] = await prisma.$transaction([
    prisma.leadNote.create({
      data: { leadId, body: input.body, isPinned: input.isPinned ?? false, authorId: actorId },
    }),
    prisma.leadActivity.create({
      data: {
        leadId,
        type: "NOTE_ADDED",
        summary: input.body.slice(0, 120),
        actorId,
      },
    }),
  ]);
  return note;
}

export async function deleteNote(noteId: string, actorId: string | null) {
  return prisma.$transaction(async (tx) => {
    const note = await tx.leadNote.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });
    await tx.leadActivity.create({
      data: {
        leadId: note.leadId,
        type: "CUSTOM",
        summary: "Note deleted",
        actorId,
      },
    });
    return note;
  });
}

// ── Follow-ups ─────────────────────────────────────────────────────────────

export async function addFollowUp(
  leadId: string,
  input: LeadFollowUpCreateInput,
  actorId: string | null,
) {
  const [followUp] = await prisma.$transaction([
    prisma.leadFollowUp.create({
      data: {
        leadId,
        channel: input.channel,
        dueAt: input.dueAt,
        notes: input.notes ?? null,
        assignedToId: input.assignedToId ?? null,
      },
    }),
    prisma.leadSubmission.update({
      where: { id: leadId },
      data: { nextFollowUpAt: input.dueAt },
    }),
    prisma.leadActivity.create({
      data: {
        leadId,
        type: "FOLLOWUP_SCHEDULED",
        summary: `Follow-up scheduled (${input.channel}) for ${input.dueAt.toISOString()}`,
        payload: input as unknown as Prisma.InputJsonValue,
        actorId,
      },
    }),
  ]);
  return followUp;
}

export async function updateFollowUp(
  followUpId: string,
  input: LeadFollowUpUpdateInput,
  actorId: string | null,
) {
  const existing = await prisma.leadFollowUp.findUnique({ where: { id: followUpId } });
  if (!existing) throw new Error("FOLLOWUP_NOT_FOUND");

  const completed = input.status === "COMPLETED" && existing.status !== "COMPLETED";

  const updated = await prisma.leadFollowUp.update({
    where: { id: followUpId },
    data: {
      status: input.status ?? undefined,
      outcome: input.outcome ?? undefined,
      dueAt: input.dueAt ?? undefined,
      notes: input.notes ?? undefined,
      ...(completed ? { completedAt: new Date(), completedById: actorId } : {}),
    },
  });

  if (completed) {
    await prisma.$transaction([
      prisma.leadSubmission.update({
        where: { id: existing.leadId },
        data: { lastContactedAt: new Date(), contactAttempts: { increment: 1 } },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: existing.leadId,
          type: "FOLLOWUP_COMPLETED",
          summary: `Follow-up completed (${existing.channel})`,
          payload: { outcome: input.outcome } as Prisma.InputJsonValue,
          actorId,
        },
      }),
    ]);

    // Recompute next follow-up for the lead (earliest pending).
    const next = await prisma.leadFollowUp.findFirst({
      where: { leadId: existing.leadId, status: "PENDING" },
      orderBy: { dueAt: "asc" },
      select: { dueAt: true },
    });
    await prisma.leadSubmission.update({
      where: { id: existing.leadId },
      data: { nextFollowUpAt: next?.dueAt ?? null },
    });
  }
  return updated;
}

/**
 * Daily-cron hook — flips overdue PENDING follow-ups to MISSED. Wire from a
 * scheduled function (Vercel Cron / GitHub Action / external scheduler).
 */
export async function reapMissedFollowUps(now = new Date()) {
  const overdue = await prisma.leadFollowUp.findMany({
    where: { status: "PENDING", dueAt: { lt: now } },
    select: { id: true, leadId: true, channel: true },
  });
  if (overdue.length === 0) return 0;
  await prisma.$transaction([
    prisma.leadFollowUp.updateMany({
      where: { id: { in: overdue.map((o) => o.id) } },
      data: { status: "MISSED" },
    }),
    prisma.leadActivity.createMany({
      data: overdue.map((o) => ({
        leadId: o.leadId,
        type: "FOLLOWUP_MISSED" as const,
        summary: `Follow-up missed (${o.channel})`,
      })),
    }),
  ]);
  return overdue.length;
}

// ── Tags ───────────────────────────────────────────────────────────────────

export async function upsertTag(input: LeadTagUpsertInput) {
  return prisma.leadTag.upsert({
    where: { slug: input.slug },
    create: { slug: input.slug, label: input.label, color: input.color ?? null },
    update: { label: input.label, color: input.color ?? null },
  });
}

export async function deleteTag(id: string) {
  return prisma.leadTag.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function listTags() {
  return prisma.leadTag.findMany({
    where: { deletedAt: null },
    orderBy: { label: "asc" },
  });
}

export async function setLeadTags(leadId: string, tagIds: string[], actorId: string | null) {
  const before = await prisma.leadTagOnLead.findMany({
    where: { leadId },
    select: { tagId: true },
  });
  const beforeSet = new Set(before.map((b) => b.tagId));
  const nextSet = new Set(tagIds);
  const toAdd = [...nextSet].filter((t) => !beforeSet.has(t));
  const toRemove = [...beforeSet].filter((t) => !nextSet.has(t));

  const ops: Prisma.PrismaPromise<unknown>[] = [];
  if (toRemove.length > 0) {
    ops.push(
      prisma.leadTagOnLead.deleteMany({ where: { leadId, tagId: { in: toRemove } } }),
    );
  }
  if (toAdd.length > 0) {
    ops.push(
      prisma.leadTagOnLead.createMany({
        data: toAdd.map((tagId) => ({ leadId, tagId })),
        skipDuplicates: true,
      }),
    );
  }
  ops.push(
    prisma.leadActivity.createMany({
      data: [
        ...toAdd.map((tagId) => ({
          leadId,
          type: "TAG_ADDED" as const,
          summary: `Tag added`,
          payload: { tagId } as Prisma.InputJsonValue,
          actorId,
        })),
        ...toRemove.map((tagId) => ({
          leadId,
          type: "TAG_REMOVED" as const,
          summary: `Tag removed`,
          payload: { tagId } as Prisma.InputJsonValue,
          actorId,
        })),
      ],
    }),
  );
  if (ops.length === 0) return;
  await prisma.$transaction(ops);
}

// ── Bulk ───────────────────────────────────────────────────────────────────

export async function bulkAction(input: LeadBulkActionInput, actorId: string | null) {
  const { ids, action } = input;
  switch (action) {
    case "assign":
      for (const id of ids) {
        await reassignLead(id, input.assignedToId ?? null, actorId, "Bulk assign");
      }
      return { changed: ids.length };
    case "status":
      if (!input.status) throw new Error("BULK_STATUS_REQUIRED");
      await prisma.$transaction([
        prisma.leadSubmission.updateMany({
          where: { id: { in: ids } },
          data: {
            status: input.status,
            ...(["WON", "LOST"].includes(input.status) ? { closedAt: new Date() } : {}),
          },
        }),
        prisma.leadActivity.createMany({
          data: ids.map((leadId) => ({
            leadId,
            type: "STATUS_CHANGED" as const,
            summary: `Bulk → ${input.status}`,
            actorId,
          })),
        }),
      ]);
      return { changed: ids.length };
    case "stage":
      if (!input.stage) throw new Error("BULK_STAGE_REQUIRED");
      await prisma.$transaction([
        prisma.leadSubmission.updateMany({
          where: { id: { in: ids } },
          data: { stage: input.stage },
        }),
        prisma.leadActivity.createMany({
          data: ids.map((leadId) => ({
            leadId,
            type: "STAGE_CHANGED" as const,
            summary: `Bulk → ${input.stage}`,
            actorId,
          })),
        }),
      ]);
      return { changed: ids.length };
    case "addTag":
      if (!input.tagId) throw new Error("BULK_TAG_REQUIRED");
      await prisma.leadTagOnLead.createMany({
        data: ids.map((leadId) => ({ leadId, tagId: input.tagId! })),
        skipDuplicates: true,
      });
      return { changed: ids.length };
    case "removeTag":
      if (!input.tagId) throw new Error("BULK_TAG_REQUIRED");
      await prisma.leadTagOnLead.deleteMany({
        where: { leadId: { in: ids }, tagId: input.tagId },
      });
      return { changed: ids.length };
    case "delete":
      await prisma.leadSubmission.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });
      return { changed: ids.length };
  }
}

// ── CSV export ─────────────────────────────────────────────────────────────

const CSV_COLUMNS = [
  "id",
  "createdAt",
  "source",
  "status",
  "stage",
  "temperature",
  "priority",
  "score",
  "firstName",
  "lastName",
  "email",
  "phone",
  "whatsapp",
  "countryCode",
  "preferredIntake",
  "budgetUsd",
  "ielts",
  "gpa",
  "assignedTo",
  "tags",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "lastContactedAt",
  "nextFollowUpAt",
] as const;

export async function exportLeadsCsv(params: LeadListQuery): Promise<string> {
  const where: Prisma.LeadSubmissionWhereInput = {
    deletedAt: null,
    ...(params.source ? { source: params.source } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.stage ? { stage: params.stage } : {}),
    ...(params.temperature ? { temperature: params.temperature } : {}),
    ...(params.priority ? { priority: params.priority } : {}),
    ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
    ...(params.unassigned ? { assignedToId: null } : {}),
    ...(params.countryCode ? { countryCode: params.countryCode.toUpperCase() } : {}),
    ...(params.tagId ? { tags: { some: { tagId: params.tagId } } } : {}),
    ...(params.createdFrom || params.createdTo
      ? {
          createdAt: {
            ...(params.createdFrom ? { gte: params.createdFrom } : {}),
            ...(params.createdTo ? { lte: params.createdTo } : {}),
          },
        }
      : {}),
    ...buildSearch(params.query),
  };

  const rows = await prisma.leadSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10_000,
    include: {
      assignedTo: { select: { email: true, name: true } },
      tags: { include: { tag: { select: { slug: true } } } },
    },
  });

  const header = CSV_COLUMNS.join(",");
  const body = rows
    .map((r) =>
      CSV_COLUMNS.map((col) => {
        switch (col) {
          case "assignedTo":
            return csvEscape(r.assignedTo?.email ?? r.assignedTo?.name ?? "");
          case "tags":
            return csvEscape(r.tags.map((t) => t.tag.slug).join("|"));
          case "createdAt":
          case "lastContactedAt":
          case "nextFollowUpAt": {
            const v = r[col];
            return csvEscape(v ? new Date(v).toISOString() : "");
          }
          default:
            return csvEscape((r as Record<string, unknown>)[col]);
        }
      }).join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// ── Analytics ──────────────────────────────────────────────────────────────

export async function analyticsSummary(params?: { from?: Date; to?: Date }) {
  const from = params?.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = params?.to ?? new Date();
  const baseWhere: Prisma.LeadSubmissionWhereInput = {
    deletedAt: null,
    createdAt: { gte: from, lte: to },
  };

  const [
    total,
    bySource,
    byStatus,
    byStage,
    byTemperature,
    byCountry,
    byAssignee,
    timeline,
    avgScore,
    conversionRow,
    overdueFollowUps,
    unassigned,
  ] = await Promise.all([
    prisma.leadSubmission.count({ where: baseWhere }),
    prisma.leadSubmission.groupBy({ by: ["source"], where: baseWhere, _count: { _all: true } }),
    prisma.leadSubmission.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.leadSubmission.groupBy({ by: ["stage"], where: baseWhere, _count: { _all: true } }),
    prisma.leadSubmission.groupBy({
      by: ["temperature"],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.leadSubmission.groupBy({
      by: ["countryCode"],
      where: { ...baseWhere, countryCode: { not: null } },
      _count: { _all: true },
    }),
    prisma.leadSubmission.groupBy({
      by: ["assignedToId"],
      where: { ...baseWhere, assignedToId: { not: null } },
      _count: { _all: true },
    }),
    leadsPerDay(from, to),
    prisma.leadSubmission.aggregate({ where: baseWhere, _avg: { score: true } }),
    prisma.leadSubmission.groupBy({
      by: ["status"],
      where: { ...baseWhere, status: { in: ["WON", "LOST"] } },
      _count: { _all: true },
    }),
    prisma.leadSubmission.count({
      where: { deletedAt: null, nextFollowUpAt: { lt: new Date() } },
    }),
    prisma.leadSubmission.count({
      where: {
        deletedAt: null,
        assignedToId: null,
        status: { in: ["NEW", "CONTACTED"] },
      },
    }),
  ]);

  const won = conversionRow.find((r) => r.status === "WON")?._count._all ?? 0;
  const lost = conversionRow.find((r) => r.status === "LOST")?._count._all ?? 0;
  const closed = won + lost;
  const conversionRate = closed > 0 ? won / closed : 0;

  return {
    range: { from, to },
    total,
    averageScore: avgScore._avg.score ?? 0,
    conversionRate,
    won,
    lost,
    overdueFollowUps,
    unassigned,
    bySource: bySource.map((r) => ({ key: r.source, count: r._count._all })),
    byStatus: byStatus.map((r) => ({ key: r.status, count: r._count._all })),
    byStage: byStage.map((r) => ({ key: r.stage, count: r._count._all })),
    byTemperature: byTemperature.map((r) => ({ key: r.temperature, count: r._count._all })),
    byCountry: byCountry
      .map((r) => ({ key: r.countryCode!, count: r._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    byAssignee: byAssignee
      .map((r) => ({ userId: r.assignedToId!, count: r._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    timeline,
  };
}

async function leadsPerDay(from: Date, to: Date) {
  // Raw SQL keeps the query cheap and timezone-stable. If your Prisma layer
  // adds a typed groupBy by date, swap this for the typed call.
  const rows = await prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
    SELECT date_trunc('day', "createdAt") as day, count(*)::bigint as count
    FROM "LeadSubmission"
    WHERE "deletedAt" IS NULL
      AND "createdAt" >= ${from}
      AND "createdAt" <= ${to}
    GROUP BY 1
    ORDER BY 1
  `;
  return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
}
