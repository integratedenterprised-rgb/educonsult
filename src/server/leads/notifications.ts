/**
 * Lead notification dispatcher.
 *
 *   created   → admin alert + lead confirmation email + WhatsApp template
 *   duplicate → admin alert only (avoid annoying the lead with two emails)
 *   followup  → counsellor reminder
 *   status    → counsellor + admin on win/loss
 *
 * The dispatcher fans out to the channel adapters (`emailAdapter`,
 * `whatsappAdapter`) and persists a `LeadMessage` row per outbound send so the
 * timeline is the audit log.
 *
 * Adapters are kept behind small interfaces so SMTP / Resend / SendGrid /
 * Postmark are all swappable without changing this file. Configuration lives
 * in env (see `src/lib/env.ts` for the relevant vars when wiring real
 * providers); in dev the no-op adapters log to console.
 */
import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { emailAdapter, whatsappAdapter } from "./channels";
import { renderTemplate, type LeadTemplateKey } from "./templates";

export type NotifyKind = "created" | "duplicate" | "followup" | "status" | "assigned";

export interface DispatchArgs {
  leadId: string;
  kind: NotifyKind;
  /** Optional extra context for templates. */
  extra?: Record<string, unknown>;
  /** Set when an action triggered this (admin user). */
  actorId?: string | null;
}

export async function dispatchLeadNotifications(args: DispatchArgs): Promise<void> {
  const lead = await prisma.leadSubmission.findUnique({
    where: { id: args.leadId },
    include: {
      assignedTo: { select: { id: true, email: true, name: true } },
      form: { select: { emailTo: true, key: true } },
    },
  });
  if (!lead) return;

  const adminEmail = lead.form?.emailTo ?? process.env.LEAD_NOTIFY_EMAIL_TO ?? null;
  const ctx = {
    lead,
    extra: args.extra ?? {},
  };

  // Always: admin alert email if a recipient is configured.
  if (adminEmail) {
    await sendEmail({
      leadId: lead.id,
      to: adminEmail,
      templateKey: keyFor("admin", args.kind),
      ctx,
      triggeredById: args.actorId ?? null,
    });
  }

  // Counsellor copy
  if (lead.assignedTo?.email && args.kind !== "duplicate") {
    await sendEmail({
      leadId: lead.id,
      to: lead.assignedTo.email,
      templateKey: keyFor("counsellor", args.kind),
      ctx,
      triggeredById: args.actorId ?? null,
    });
  }

  // Lead-facing confirmation (only on initial creation; never on duplicate)
  if (args.kind === "created" && lead.email) {
    await sendEmail({
      leadId: lead.id,
      to: lead.email,
      templateKey: keyFor("lead", args.kind),
      ctx,
      triggeredById: args.actorId ?? null,
    });
  }

  // WhatsApp confirmation (if the lead opted in / provided whatsapp number)
  if (args.kind === "created" && lead.whatsapp) {
    await sendWhatsApp({
      leadId: lead.id,
      to: lead.whatsapp,
      templateKey: "lead_created_whatsapp",
      ctx,
      triggeredById: args.actorId ?? null,
    });
  }
}

function keyFor(audience: "admin" | "counsellor" | "lead", kind: NotifyKind): LeadTemplateKey {
  return `${audience}_${kind}` as LeadTemplateKey;
}

// ── Channel wrappers — persist a LeadMessage, then hand to the adapter ────

interface SendArgs {
  leadId: string;
  to: string;
  templateKey: LeadTemplateKey;
  ctx: Record<string, unknown>;
  triggeredById: string | null;
}

async function sendEmail(args: SendArgs): Promise<void> {
  const rendered = renderTemplate(args.templateKey, args.ctx);
  if (!rendered) return; // template not configured — skip silently

  const row = await prisma.leadMessage.create({
    data: {
      leadId: args.leadId,
      channel: "EMAIL",
      direction: "OUTBOUND",
      status: "QUEUED",
      toAddress: args.to,
      fromAddress: process.env.LEAD_NOTIFY_EMAIL_FROM ?? null,
      subject: rendered.subject ?? null,
      body: rendered.body,
      templateKey: args.templateKey,
      templateParams: args.ctx as unknown as Prisma.InputJsonValue,
      triggeredById: args.triggeredById,
    },
  });

  try {
    const result = await emailAdapter.send({
      to: args.to,
      from: process.env.LEAD_NOTIFY_EMAIL_FROM ?? "no-reply@localhost",
      subject: rendered.subject ?? "(no subject)",
      html: rendered.body,
    });
    await prisma.leadMessage.update({
      where: { id: row.id },
      data: {
        status: "SENT",
        providerMessageId: result.providerMessageId ?? null,
        sentAt: new Date(),
      },
    });
    await prisma.leadActivity.create({
      data: {
        leadId: args.leadId,
        type: "EMAIL_SENT",
        summary: rendered.subject ?? "Email sent",
        payload: { to: args.to, template: args.templateKey } as unknown as Prisma.InputJsonValue,
        actorId: args.triggeredById,
      },
    });
  } catch (e) {
    await prisma.leadMessage.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        errorMessage: e instanceof Error ? e.message : "Unknown error",
      },
    });
  }
}

async function sendWhatsApp(args: SendArgs): Promise<void> {
  const rendered = renderTemplate(args.templateKey, args.ctx);
  if (!rendered) return;

  const row = await prisma.leadMessage.create({
    data: {
      leadId: args.leadId,
      channel: "WHATSAPP",
      direction: "OUTBOUND",
      status: "QUEUED",
      toAddress: args.to,
      fromAddress: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
      body: rendered.body,
      templateKey: args.templateKey,
      templateParams: args.ctx as unknown as Prisma.InputJsonValue,
      triggeredById: args.triggeredById,
    },
  });

  try {
    const result = await whatsappAdapter.send({
      to: args.to,
      templateName: args.templateKey,
      languageCode: "en",
      // Components carry the per-template variables. We pass the rendered
      // body as a single body-component for templates that don't need
      // structured parameters; richer templates can map ctx → components.
      bodyText: rendered.body,
      params: args.ctx,
    });
    await prisma.leadMessage.update({
      where: { id: row.id },
      data: {
        status: "SENT",
        providerMessageId: result.providerMessageId ?? null,
        sentAt: new Date(),
      },
    });
    await prisma.leadActivity.create({
      data: {
        leadId: args.leadId,
        type: "WHATSAPP_SENT",
        summary: "WhatsApp message sent",
        payload: { to: args.to, template: args.templateKey } as unknown as Prisma.InputJsonValue,
        actorId: args.triggeredById,
      },
    });
  } catch (e) {
    await prisma.leadMessage.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        errorMessage: e instanceof Error ? e.message : "Unknown error",
      },
    });
  }
}
