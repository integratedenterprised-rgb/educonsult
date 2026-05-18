/**
 * Public PR pathways index — list active PR pathways, optionally filtered
 * by destination country. Includes steps for the requested locale.
 */
import type { NextRequest } from "next/server";
import type { Locale } from "@prisma/client";
import { ok } from "@/server/api/response";
import { prisma } from "@/lib/prisma";
import { parseLocale } from "@/server/career/_locale";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const locale = parseLocale(params.get("locale"));
  const countryParam = params.get("country");

  let countryId: string | undefined;
  if (countryParam) {
    const c = await prisma.country.findUnique({
      where: { code: countryParam.toUpperCase() },
      select: { id: true },
    });
    if (!c) return ok([]);
    countryId = c.id;
  }

  const rows = await prisma.prPathway.findMany({
    where: { deletedAt: null, isActive: true, ...(countryId ? { countryId } : {}) },
    orderBy: [{ priority: "desc" }, { difficulty: "asc" }],
    include: {
      country: {
        select: {
          id: true,
          code: true,
          slug: true,
          translations: { where: { locale: { in: [locale, "EN"] } } },
        },
      },
      translations: { where: { locale: { in: [locale, "EN"] } } },
      steps: {
        orderBy: { order: "asc" },
        include: { translations: { where: { locale: { in: [locale, "EN"] } } } },
      },
    },
  });

  const pick = <T extends { locale: Locale }>(arr: T[]): T | undefined =>
    arr.find((r) => r.locale === locale) ?? arr.find((r) => r.locale === "EN");

  return ok(
    rows.map((p) => {
      const t = pick(p.translations);
      const ct = pick(p.country.translations);
      return {
        id: p.id,
        slug: p.slug,
        type: p.type,
        difficulty: p.difficulty,
        minYearsToPr: p.minYearsToPr,
        pointsRequired: p.pointsRequired,
        ageLimit: p.ageLimit,
        englishMinBand: p.englishMinBand,
        externalUrl: p.externalUrl,
        country: {
          code: p.country.code,
          slug: p.country.slug,
          name: ct?.name ?? p.country.code,
        },
        name: t?.name ?? p.slug,
        summary: t?.summary ?? null,
        body: t?.body ?? null,
        steps: p.steps.map((s) => {
          const st = pick(s.translations);
          return {
            id: s.id,
            order: s.order,
            durationMonths: s.durationMonths,
            title: st?.title ?? "",
            detail: st?.detail ?? null,
          };
        }),
      };
    }),
  );
}
