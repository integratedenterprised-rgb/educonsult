/**
 * Public single-course detail. Returns the course with its country mappings,
 * outcomes, salary bands (mid-level, latest year), and demand signals.
 */
import type { NextRequest } from "next/server";
import type { Locale } from "@prisma/client";
import { ApiErrors, ok } from "@/server/api/response";
import { prisma } from "@/lib/prisma";
import { parseLocale } from "@/server/career/_locale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const locale = parseLocale(req.nextUrl.searchParams.get("locale"));

  const course = await prisma.course.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
    include: {
      translations: { where: { locale: { in: [locale, "EN"] } } },
      outcomes: {
        orderBy: { order: "asc" },
        include: { translations: { where: { locale: { in: [locale, "EN"] } } } },
      },
      countryMappings: {
        include: {
          country: {
            include: { translations: { where: { locale: { in: [locale, "EN"] } } } },
          },
          prPathwayLinks: {
            include: {
              pathway: {
                include: { translations: { where: { locale: { in: [locale, "EN"] } } } },
              },
            },
          },
        },
      },
      salaryEstimates: {
        orderBy: { effectiveYear: "desc" },
        include: { country: { select: { code: true, slug: true } } },
      },
      demandSignals: {
        orderBy: { effectiveYear: "desc" },
        include: { country: { select: { code: true, slug: true } } },
      },
    },
  });

  if (!course) return ApiErrors.notFound("Course");

  const pick = <T extends { locale: Locale }>(rows: T[]): T | undefined =>
    rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "EN");

  const t = pick(course.translations);
  return ok({
    id: course.id,
    slug: course.slug,
    level: course.level,
    field: course.field,
    discipline: course.discipline,
    durationMonths: course.durationMonths,
    imageUrl: course.imageUrl,
    name: t?.name ?? course.slug,
    shortIntro: t?.shortIntro ?? null,
    description: t?.description ?? null,
    outcomes: course.outcomes.map((o) => {
      const ot = pick(o.translations);
      return {
        id: o.id,
        occupation: o.occupation,
        anzscoCode: o.anzscoCode,
        fitScore: o.fitScore,
        title: ot?.title ?? o.occupation,
        blurb: ot?.blurb ?? null,
      };
    }),
    countries: course.countryMappings.map((m) => {
      const ct = pick(m.country.translations);
      return {
        countryId: m.countryId,
        code: m.country.code,
        slug: m.country.slug,
        name: ct?.name ?? m.country.code,
        avgTuitionUsd: m.avgTuitionUsd,
        livingCostUsd: m.livingCostUsd,
        intakeMonths: m.intakeMonths,
        topUniversities: m.topUniversities,
        prEligible: m.prEligible,
        graduateVisaMonths: m.graduateVisaMonths,
        notes: m.notes,
        prPathways: m.prPathwayLinks.map((l) => {
          const pt = pick(l.pathway.translations);
          return {
            id: l.pathwayId,
            slug: l.pathway.slug,
            type: l.pathway.type,
            difficulty: l.pathway.difficulty,
            minYearsToPr: l.pathway.minYearsToPr,
            name: pt?.name ?? l.pathway.slug,
            summary: pt?.summary ?? null,
          };
        }),
      };
    }),
    salaries: course.salaryEstimates.map((s) => ({
      id: s.id,
      countryCode: s.country.code,
      occupation: s.occupation,
      level: s.level,
      period: s.period,
      currency: s.currency,
      min: s.minAmount,
      mid: s.midAmount,
      max: s.maxAmount,
      year: s.effectiveYear,
      source: s.source,
    })),
    demand: course.demandSignals.map((d) => ({
      id: d.id,
      countryCode: d.country.code,
      occupation: d.occupation,
      level: d.demandLevel,
      shortageListed: d.shortageListed,
      vacancies12mo: d.vacancies12mo,
      growthPercent: d.growthPercent,
      year: d.effectiveYear,
    })),
  });
}
