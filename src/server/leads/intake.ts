/**
 * Public lead intake.
 *
 * Single entry point for every public-facing form:
 *   - Eligibility form           → ELIGIBILITY_FORM
 *   - Visa-risk form             → VISA_RISK_FORM
 *   - Consultation booking       → CONSULTATION_FORM
 *   - Resource (gated) download  → RESOURCE_DOWNLOAD
 *
 * Pipeline per submission:
 *   1. Validate (caller already did this via parsePublicLead)
 *   2. Score (pure function, fills temperature + priority)
 *   3. Dedupe by email/phone within a recent window — same person submitting
 *      twice within 24h updates the existing lead instead of creating a dupe
 *   4. Persist lead + emit CREATED activity
 *   5. Auto-assign if a counsellor with capacity is available
 *   6. Dispatch notifications (admin email; lead confirmation; WhatsApp
 *      template when applicable) — non-blocking
 *
 * The function is awaited by the route handler but notification dispatch is
 * fire-and-forget so a slow SMTP doesn't bottleneck form submission.
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreLead } from "./scoring";
import { autoAssignCounsellor } from "./assignment";
import { dispatchLeadNotifications } from "./notifications";
import { attachSessionToLead, recordServerEvent } from "@/server/analytics/events.service";
import type {
  ConsultationLeadInput,
  EligibilityLeadInput,
  PublicLeadInput,
  ResourceDownloadLeadInput,
  VisaRiskLeadInput,
} from "@/lib/validators/lead";

export interface IntakeContext {
  /** Caller-controlled fields the validator deliberately doesn't accept. */
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Already-known form row (if the section's `LeadForm` is registered). */
  formId?: string | null;
  /** Analytics cookies from the visitor — used to attach prior pageviews
   *  to this lead for first-touch attribution. */
  anonId?: string | null;
  sessionId?: string | null;
}

export interface IntakeResult {
  leadId: string;
  isDuplicate: boolean;
  score: number;
  temperature: "HOT" | "WARM" | "COLD";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

const DUPLICATE_WINDOW_HOURS = 24;

export async function submitPublicLead(
  payload: PublicLeadInput,
  ctx: IntakeContext = {},
): Promise<IntakeResult> {
  // 1. Score
  const scoring = scoreLead({
    source: payload.source,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    whatsapp: payload.whatsapp ?? null,
    countryCode: payload.countryCode ?? null,
    preferredIntake: payload.preferredIntake ?? null,
    budgetUsd: pickBudget(payload),
    gpa: pickNumber(payload, "gpa"),
    ielts: pickNumber(payload, "ielts"),
    toefl: pickNumber(payload, "toefl"),
    pte: pickNumber(payload, "pte"),
    duolingo: pickNumber(payload, "duolingo"),
    educationLevel: pickStr(payload, "educationLevel"),
    workExperienceYears: pickNumber(payload, "workExperienceYears"),
    visaRiskLevel: payload.source === "VISA_RISK_FORM" ? payload.riskLevel ?? null : null,
    visaRiskScore: payload.source === "VISA_RISK_FORM" ? payload.riskScore ?? null : null,
    preferredAt: payload.source === "CONSULTATION_FORM" ? payload.preferredAt ?? null : null,
    consentMarketing:
      payload.source === "RESOURCE_DOWNLOAD" ? payload.consentMarketing ?? null : null,
  });

  // 2. Dedupe — look for the same person submitting within the recent window.
  const dedupeMatch = await findRecentMatch(payload.email, payload.phone);

  const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(" ").trim() || null;
  const data = sourceSpecificData(payload);

  // 3. Persist (create new, or merge into the existing dupe).
  const lead = await prisma.$transaction(async (tx) => {
    if (dedupeMatch) {
      const updated = await tx.leadSubmission.update({
        where: { id: dedupeMatch.id },
        data: {
          source: payload.source,
          formId: ctx.formId ?? dedupeMatch.formId,
          data: mergeData(dedupeMatch.data, data),
          firstName: payload.firstName,
          lastName: payload.lastName ?? dedupeMatch.lastName,
          fullName: fullName ?? dedupeMatch.fullName,
          email: payload.email ?? dedupeMatch.email,
          phone: payload.phone ?? dedupeMatch.phone,
          whatsapp: payload.whatsapp ?? dedupeMatch.whatsapp,
          countryCode: payload.countryCode ?? dedupeMatch.countryCode,
          preferredIntake: payload.preferredIntake ?? dedupeMatch.preferredIntake,
          budgetUsd: pickBudget(payload) ?? dedupeMatch.budgetUsd,
          ielts: pickNumber(payload, "ielts") ?? dedupeMatch.ielts,
          gpa: pickNumber(payload, "gpa") ?? dedupeMatch.gpa,
          sourceUrl: payload.sourceUrl ?? dedupeMatch.sourceUrl,
          referrerUrl: payload.referrerUrl ?? dedupeMatch.referrerUrl,
          utmSource: payload.utmSource ?? dedupeMatch.utmSource,
          utmMedium: payload.utmMedium ?? dedupeMatch.utmMedium,
          utmCampaign: payload.utmCampaign ?? dedupeMatch.utmCampaign,
          utmTerm: payload.utmTerm ?? dedupeMatch.utmTerm,
          utmContent: payload.utmContent ?? dedupeMatch.utmContent,
          ipAddress: ctx.ipAddress ?? dedupeMatch.ipAddress,
          userAgent: ctx.userAgent ?? dedupeMatch.userAgent,
          locale: payload.locale ?? dedupeMatch.locale,
          // Re-score against the merged signal — better never worse.
          score: Math.max(dedupeMatch.score ?? 0, scoring.score),
          scoreBreakdown: scoring.breakdown as unknown as Prisma.InputJsonValue,
          temperature: scoring.temperature,
          priority: scoring.priority,
          visaRiskLevel:
            payload.source === "VISA_RISK_FORM" ? payload.riskLevel ?? null : dedupeMatch.visaRiskLevel,
          visaRiskScore:
            payload.source === "VISA_RISK_FORM" ? payload.riskScore ?? null : dedupeMatch.visaRiskScore,
          resourceId:
            payload.source === "RESOURCE_DOWNLOAD" ? payload.resourceId : dedupeMatch.resourceId,
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: updated.id,
          type: "CUSTOM",
          summary: `Duplicate submission from ${payload.source}; merged into existing lead.`,
          payload: { source: payload.source } as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    }

    const created = await tx.leadSubmission.create({
      data: {
        source: payload.source,
        formId: ctx.formId ?? null,
        data: data as unknown as Prisma.InputJsonValue,
        firstName: payload.firstName,
        lastName: payload.lastName ?? null,
        fullName,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        whatsapp: payload.whatsapp ?? null,
        countryCode: payload.countryCode ?? null,
        preferredIntake: payload.preferredIntake ?? null,
        budgetUsd: pickBudget(payload),
        ielts: pickNumber(payload, "ielts"),
        gpa: pickNumber(payload, "gpa"),
        sourceUrl: payload.sourceUrl ?? null,
        referrerUrl: payload.referrerUrl ?? null,
        utmSource: payload.utmSource ?? null,
        utmMedium: payload.utmMedium ?? null,
        utmCampaign: payload.utmCampaign ?? null,
        utmTerm: payload.utmTerm ?? null,
        utmContent: payload.utmContent ?? null,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        locale: payload.locale ?? null,
        status: "NEW",
        stage: "NEW",
        score: scoring.score,
        scoreBreakdown: scoring.breakdown as unknown as Prisma.InputJsonValue,
        temperature: scoring.temperature,
        priority: scoring.priority,
        visaRiskLevel: payload.source === "VISA_RISK_FORM" ? payload.riskLevel ?? null : null,
        visaRiskScore: payload.source === "VISA_RISK_FORM" ? payload.riskScore ?? null : null,
        resourceId: payload.source === "RESOURCE_DOWNLOAD" ? payload.resourceId : null,
      },
    });

    await tx.leadActivity.create({
      data: {
        leadId: created.id,
        type: "CREATED",
        summary: `Lead created via ${payload.source}`,
        payload: {
          score: scoring.score,
          temperature: scoring.temperature,
          priority: scoring.priority,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return created;
  });

  // 4. Auto-assign — runs outside the txn so a failure here never voids the
  //    lead. Worst case the admin assigns manually.
  if (!dedupeMatch) {
    try {
      await autoAssignCounsellor(lead.id, payload.countryCode ?? null);
    } catch (e) {
      console.error("autoAssignCounsellor failed", e);
    }
  }

  // 5. Notify — deferred via `after` so a slow SMTP/WhatsApp dispatch
  //    can't bottleneck form submission AND so the serverless runtime keeps
  //    the function warm until the promise settles (a plain fire-and-forget
  //    would be cut off on Vercel as soon as the response is returned).
  after(async () => {
    try {
      await dispatchLeadNotifications({
        leadId: lead.id,
        kind: dedupeMatch ? "duplicate" : "created",
      });
    } catch (e) {
      console.error("dispatchLeadNotifications failed", e);
    }
  });

  // 6. Analytics — attach this visitor's sessions to the lead and emit the
  //    lifecycle event. Best-effort; never blocks intake. Also deferred so
  //    the DB write completes even after the response is sent.
  after(async () => {
    try { await attachSessionToLead(ctx.anonId, ctx.sessionId, lead.id); }
    catch (e) { console.error("attachSessionToLead failed", e); }
  });
  after(async () => {
    try {
      await recordServerEvent({
        type: dedupeMatch ? "LEAD_DEDUPLICATED" : "LEAD_CREATED",
        leadId: lead.id,
        anonId: ctx.anonId ?? undefined,
        sessionId: ctx.sessionId ?? undefined,
        properties: {
          source: payload.source,
          score: scoring.score,
          temperature: scoring.temperature,
          priority: scoring.priority,
          countryCode: payload.countryCode ?? null,
        },
      });
    } catch (e) {
      console.error("recordServerEvent failed", e);
    }
  });

  return {
    leadId: lead.id,
    isDuplicate: Boolean(dedupeMatch),
    score: scoring.score,
    temperature: scoring.temperature,
    priority: scoring.priority,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function findRecentMatch(email?: string | null, phone?: string | null) {
  if (!email && !phone) return null;
  const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000);
  return prisma.leadSubmission.findFirst({
    where: {
      deletedAt: null,
      createdAt: { gte: since },
      OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(Boolean) as
        | Prisma.LeadSubmissionWhereInput[]
        | [Prisma.LeadSubmissionWhereInput, Prisma.LeadSubmissionWhereInput],
    },
    orderBy: { createdAt: "desc" },
  });
}

function sourceSpecificData(p: PublicLeadInput): Record<string, unknown> {
  switch (p.source) {
    case "ELIGIBILITY_FORM": {
      const e = p as EligibilityLeadInput;
      return {
        gpa: e.gpa,
        ielts: e.ielts,
        toefl: e.toefl,
        pte: e.pte,
        duolingo: e.duolingo,
        educationLevel: e.educationLevel,
        fieldOfStudy: e.fieldOfStudy,
        workExperienceYears: e.workExperienceYears,
        budgetUsd: e.budgetUsd,
        ...(e.extras ?? {}),
      };
    }
    case "VISA_RISK_FORM": {
      const v = p as VisaRiskLeadInput;
      return {
        answers: v.answers,
        riskLevel: v.riskLevel,
        riskScore: v.riskScore,
        triggeredRules: v.triggeredRules,
      };
    }
    case "CONSULTATION_FORM": {
      const c = p as ConsultationLeadInput;
      return {
        preferredAt: c.preferredAt?.toISOString(),
        channel: c.channel,
        topic: c.topic,
        message: c.message,
      };
    }
    case "RESOURCE_DOWNLOAD": {
      const r = p as ResourceDownloadLeadInput;
      return {
        resourceId: r.resourceId,
        consentMarketing: r.consentMarketing,
      };
    }
  }
}

function mergeData(prior: unknown, next: Record<string, unknown>): Prisma.InputJsonValue {
  const base = (typeof prior === "object" && prior && !Array.isArray(prior) ? prior : {}) as Record<
    string,
    unknown
  >;
  return { ...base, ...next } as Prisma.InputJsonValue;
}

function pickNumber(p: PublicLeadInput, key: string): number | null {
  const v = (p as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function pickStr(p: PublicLeadInput, key: string): string | null {
  const v = (p as Record<string, unknown>)[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

function pickBudget(p: PublicLeadInput): number | null {
  if (p.source === "ELIGIBILITY_FORM") return p.budgetUsd ?? null;
  return null;
}
