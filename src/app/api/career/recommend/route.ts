/**
 * Public career recommendation endpoint.
 *
 * POST { profile, locale?, limit?, captureLead?, contact? }
 *   → { cards, suggestions, totalCandidates, appliedWeights }
 *
 * Optionally captures a lead via the standard intake pipeline so counsellors
 * see the verdict alongside the contact. Non-fatal: the recommendation is
 * returned even if lead capture fails.
 */
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { ApiErrors, ok } from "@/server/api/response";
import { careerRecommendSchema } from "@/lib/validators/career";
import { recommend } from "@/server/career/engine";
import { submitPublicLead } from "@/server/leads/intake";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = careerRecommendSchema.safeParse(raw);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  const { profile, locale, limit, captureLead, contact } = parsed.data;

  let result;
  try {
    result = await recommend(profile, { locale, limit });
  } catch (e) {
    console.error("career recommend failed", e);
    return ApiErrors.serverError();
  }

  // Persist the recommendation run for analytics; failure shouldn't take the
  // response down with it.
  let recommendationId: string | null = null;
  try {
    const row = await prisma.careerRecommendation.create({
      data: {
        profile: profile as unknown as Prisma.InputJsonValue,
        ranked: result.cards.map((c) => ({
          courseId: c.courseId,
          countryId: c.countryId,
          score: c.score,
          dimensions: c.dimensions,
        })) as unknown as Prisma.InputJsonValue,
        topCourseId: result.cards[0]?.courseId ?? null,
        topCountryId: result.cards[0]?.countryId ?? null,
        locale: locale ?? null,
        source: "public_form",
      },
    });
    recommendationId = row.id;
  } catch (e) {
    console.error("career recommend persist failed", e);
  }

  let leadId: string | null = null;
  if (captureLead && contact?.firstName && (contact.email || contact.phone)) {
    try {
      const lead = await submitPublicLead(
        {
          source: "CONSULTATION_FORM",
          firstName: contact.firstName,
          lastName: contact.lastName ?? null,
          email: contact.email ?? null,
          phone: contact.phone ?? null,
          whatsapp: contact.whatsapp ?? null,
          countryCode:
            result.cards[0]?.countryCode ?? profile.preferredCountries?.[0] ?? null,
          preferredIntake: profile.preferredIntake ?? null,
          answers: {
            ...(profile as Record<string, unknown>),
            careerRecommendation: result.cards.slice(0, 5).map((c) => ({
              courseSlug: c.courseSlug,
              countryCode: c.countryCode,
              score: c.score,
            })),
          },
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
      if (recommendationId) {
        await prisma.careerRecommendation
          .update({ where: { id: recommendationId }, data: { leadId } })
          .catch(() => null);
      }
    } catch (e) {
      console.error("career recommend capture lead failed", e);
    }
  }

  return ok({
    recommendationId,
    leadId,
    totalCandidates: result.totalCandidates,
    cards: result.cards,
    suggestions: result.suggestions,
    appliedWeights: result.appliedWeights,
  });
}
