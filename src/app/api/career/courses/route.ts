/**
 * Public courses index. Returns active, published courses with their default
 * translation (locale-aware via `?locale=NE` etc.).
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { ok } from "@/server/api/response";
import { prisma } from "@/lib/prisma";
import { parseLocale } from "@/server/career/_locale";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const locale = parseLocale(params.get("locale"));
  const field = params.get("field");
  const level = params.get("level");

  const where: Prisma.CourseWhereInput = { deletedAt: null, status: "PUBLISHED" };
  if (field) where.field = field;
  if (level) where.level = level as Prisma.CourseWhereInput["level"];

  const courses = await prisma.course.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }],
    include: {
      translations: { where: { locale: { in: [locale, "EN"] } } },
      _count: { select: { countryMappings: true, outcomes: true } },
    },
  });

  const data = courses.map((c) => {
    const t = c.translations.find((x) => x.locale === locale) ?? c.translations.find((x) => x.locale === "EN");
    return {
      id: c.id,
      slug: c.slug,
      level: c.level,
      field: c.field,
      discipline: c.discipline,
      durationMonths: c.durationMonths,
      isFeatured: c.isFeatured,
      imageUrl: c.imageUrl,
      name: t?.name ?? c.slug,
      shortIntro: t?.shortIntro ?? null,
      countries: c._count.countryMappings,
      outcomes: c._count.outcomes,
    };
  });
  return ok(data);
}
