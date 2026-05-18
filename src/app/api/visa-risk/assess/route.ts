/**
 * Public visa-risk assessment endpoint.
 *
 * POST { profile, locale?, captureLead?, contact? }
 *   → { score, level, levelLabel, levelDescription, triggered, suggestions }
 *
 * When `captureLead` is true and `contact` is supplied, the assessment also
 * lands a `VISA_RISK_FORM` lead via the standard intake pipeline so the
 * counsellor inbox sees the verdict alongside the contact.
 *
 * The endpoint is rate-limit friendly: a single Prisma read for rules + two
 * SiteSetting lookups + (optional) one write for the lead. No queues, no
 * background work.
 */
import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { visaRiskAssessSchema } from "@/lib/validators/visa-risk";
import { assess } from "@/server/visa-risk/engine";
import { submitPublicLead } from "@/server/leads/intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = visaRiskAssessSchema.safeParse(raw);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  const { profile, locale, captureLead, contact } = parsed.data;

  let result;
  try {
    result = await assess(profile, { locale });
  } catch (e) {
    console.error("visa-risk assess failed", e);
    return ApiErrors.serverError();
  }

  // Optionally land the lead alongside the assessment so counsellors see it.
  let leadId: string | null = null;
  if (captureLead && contact?.firstName && (contact.email || contact.phone)) {
    try {
      const lead = await submitPublicLead(
        {
          source: "VISA_RISK_FORM",
          firstName: contact.firstName,
          lastName: contact.lastName ?? null,
          email: contact.email ?? null,
          phone: contact.phone ?? null,
          whatsapp: contact.whatsapp ?? null,
          countryCode: profile.countryCode ?? null,
          preferredIntake: profile.preferredIntake ?? null,
          answers: profile as Record<string, unknown>,
          riskLevel: result.level,
          riskScore: result.score,
          triggeredRules: result.triggered.map((t) => t.key),
          locale,
        } as Parameters<typeof submitPublicLead>[0],
        {
          ipAddress:
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            req.headers.get("x-real-ip") ??
            null,
          userAgent: req.headers.get("user-agent"),
        },
      );
      leadId = lead.leadId;
    } catch (e) {
      console.error("visa-risk capture lead failed", e);
      // Non-fatal: assessment still returns.
    }
  }

  return ok({
    score: result.score,
    rawScore: result.rawScore,
    level: result.level,
    levelLabel: result.levelLabel,
    levelDescription: result.levelDescription,
    triggered: result.triggered.map((t) => ({
      key: t.key,
      label: t.label,
      message: t.message,
      category: t.category,
      riskLevel: t.riskLevel,
      score: t.weightedScore,
    })),
    suggestions: result.suggestions,
    leadId,
  });
}
