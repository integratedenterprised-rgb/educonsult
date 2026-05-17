/**
 * Admin CRUD for Testimonial. English translation upserted alongside the row.
 */
import "server-only";
import { revalidateTag } from "next/cache";
import type { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const NOT_FOUND = "NOT_FOUND";
const LIST_TAG = "cms:testimonials";

export interface TestimonialUpsertInput {
  studentName: string;
  studentPhotoUrl?: string | null;
  universityName?: string | null;
  programName?: string | null;
  intakeYear?: number | null;
  rating?: number | null;
  isFeatured?: boolean;
  countryId?: string | null;
  status?: ContentStatus;
  quote: string;
  studentTitle?: string | null;
}

export async function listTestimonials() {
  return prisma.testimonial.findMany({
    where: { deletedAt: null },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: {
      translations: { where: { locale: "EN" }, take: 1 },
      country: { select: { code: true, slug: true } },
    },
  });
}

export async function getTestimonial(id: string) {
  return prisma.testimonial.findFirst({
    where: { id, deletedAt: null },
    include: { translations: { where: { locale: "EN" }, take: 1 } },
  });
}

export async function createTestimonial(input: TestimonialUpsertInput) {
  const created = await prisma.testimonial.create({
    data: {
      studentName: input.studentName,
      studentPhotoUrl: input.studentPhotoUrl ?? null,
      universityName: input.universityName ?? null,
      programName: input.programName ?? null,
      intakeYear: input.intakeYear ?? null,
      rating: input.rating ?? null,
      isFeatured: input.isFeatured ?? false,
      countryId: input.countryId ?? null,
      status: input.status ?? "DRAFT",
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      translations: {
        create: {
          locale: "EN",
          quote: input.quote,
          studentTitle: input.studentTitle ?? null,
        },
      },
    },
  });
  revalidateTag(LIST_TAG);
  return created;
}

export async function updateTestimonial(id: string, input: TestimonialUpsertInput) {
  const existing = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  await prisma.$transaction([
    prisma.testimonial.update({
      where: { id },
      data: {
        studentName: input.studentName,
        studentPhotoUrl: input.studentPhotoUrl ?? null,
        universityName: input.universityName ?? null,
        programName: input.programName ?? null,
        intakeYear: input.intakeYear ?? null,
        rating: input.rating ?? null,
        isFeatured: input.isFeatured ?? false,
        countryId: input.countryId ?? null,
        status: input.status ?? "DRAFT",
        publishedAt: input.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null,
      },
    }),
    prisma.testimonialTranslation.upsert({
      where: { testimonialId_locale: { testimonialId: id, locale: "EN" } },
      update: { quote: input.quote, studentTitle: input.studentTitle ?? null },
      create: { testimonialId: id, locale: "EN", quote: input.quote, studentTitle: input.studentTitle ?? null },
    }),
  ]);
  revalidateTag(LIST_TAG);
}

export async function softDeleteTestimonial(id: string) {
  const existing = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  await prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  revalidateTag(LIST_TAG);
}
