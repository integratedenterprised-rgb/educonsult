/**
 * Admin CRUD for Country entries.
 *
 * Country records carry one or more translations (one per locale); writes
 * here always upsert the canonical (`en`) translation alongside the row so
 * the public site never has to fall back to an empty title.
 */
import "server-only";
import { revalidateTag } from "next/cache";
import { Prisma, type ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CODE_TAKEN = "CODE_TAKEN";
export const SLUG_TAKEN = "SLUG_TAKEN";
export const NOT_FOUND = "NOT_FOUND";

export interface CountryUpsertInput {
  code: string;
  slug: string;
  flagUrl?: string | null;
  imageUrl?: string | null;
  avgTuitionUsd?: number | null;
  visaSuccessRate?: number | null;
  popularity?: number;
  isFeatured?: boolean;
  status?: ContentStatus;
  // English translation fields (canonical)
  name: string;
  shortIntro?: string | null;
  description?: string | null;
}

const LIST_TAG = "cms:countries";

export async function listCountries() {
  return prisma.country.findMany({
    where: { deletedAt: null },
    orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }, { code: "asc" }],
    include: { translations: { where: { locale: "EN" }, take: 1 } },
  });
}

export async function getCountry(id: string) {
  return prisma.country.findFirst({
    where: { id, deletedAt: null },
    include: { translations: { where: { locale: "EN" }, take: 1 } },
  });
}

export async function createCountry(input: CountryUpsertInput) {
  try {
    const country = await prisma.country.create({
      data: {
        code: input.code.toUpperCase(),
        slug: input.slug,
        flagUrl: input.flagUrl ?? null,
        imageUrl: input.imageUrl ?? null,
        avgTuitionUsd: input.avgTuitionUsd ?? null,
        visaSuccessRate: input.visaSuccessRate ?? null,
        popularity: input.popularity ?? 0,
        isFeatured: input.isFeatured ?? false,
        status: input.status ?? "DRAFT",
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        translations: {
          create: {
            locale: "EN",
            name: input.name,
            shortIntro: input.shortIntro ?? null,
            description: input.description ?? null,
          },
        },
      },
    });
    revalidateTag(LIST_TAG);
    return country;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | undefined)?.join(",") ?? "";
      if (target.includes("code")) throw new Error(CODE_TAKEN);
      if (target.includes("slug")) throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function updateCountry(id: string, input: CountryUpsertInput) {
  const existing = await prisma.country.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  try {
    await prisma.$transaction([
      prisma.country.update({
        where: { id },
        data: {
          code: input.code.toUpperCase(),
          slug: input.slug,
          flagUrl: input.flagUrl ?? null,
          imageUrl: input.imageUrl ?? null,
          avgTuitionUsd: input.avgTuitionUsd ?? null,
          visaSuccessRate: input.visaSuccessRate ?? null,
          popularity: input.popularity ?? 0,
          isFeatured: input.isFeatured ?? false,
          status: input.status ?? "DRAFT",
          publishedAt: input.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null,
        },
      }),
      prisma.countryTranslation.upsert({
        where: { countryId_locale: { countryId: id, locale: "EN" } },
        update: {
          name: input.name,
          shortIntro: input.shortIntro ?? null,
          description: input.description ?? null,
        },
        create: {
          countryId: id, locale: "EN",
          name: input.name,
          shortIntro: input.shortIntro ?? null,
          description: input.description ?? null,
        },
      }),
    ]);
    revalidateTag(LIST_TAG);
    revalidateTag(`cms:country:${input.slug}`);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = (e.meta?.target as string[] | undefined)?.join(",") ?? "";
      if (target.includes("code")) throw new Error(CODE_TAKEN);
      if (target.includes("slug")) throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function softDeleteCountry(id: string) {
  const existing = await prisma.country.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  await prisma.country.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  revalidateTag(LIST_TAG);
  revalidateTag(`cms:country:${existing.slug}`);
}
