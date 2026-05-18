/**
 * Admin service for the career engine.
 *
 * Covers CRUD for everything the recommendation engine reads:
 *   - Courses + translations + outcomes
 *   - Course-Country mappings (+ linked PR pathway IDs)
 *   - PR pathways + steps (+ translations)
 *   - Salary estimates
 *   - Demand signals
 *   - Career trends
 *   - Category weights + score buckets (via SiteSetting)
 *   - `previewRecommendations` — dry-run any profile against current data.
 *
 * Soft-delete the same way the rest of the CMS does (deletedAt timestamp;
 * filters at the data-access layer).
 */
import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CareerCategoryWeightsInput,
  CareerScoreBucketsInput,
  CareerTrendUpsertInput,
  CountryUpdateInput,
  CountryUpsertInput,
  CourseCountryMappingUpsertInput,
  CourseOutcomeUpsertInput,
  CourseUpdateInput,
  CourseUpsertInput,
  DemandSignalUpsertInput,
  PrPathwayUpdateInput,
  PrPathwayUpsertInput,
  SalaryEstimateUpsertInput,
} from "@/lib/validators/career";
import { recommend, type RecommendOptions } from "./engine";
import type { CareerProfile } from "./dsl";
import type { CareerCategory } from "./weights";

// ── Countries (career-engine scoped CRUD) ─────────────────────────────────

export async function listCountries(params: { status?: string } = {}) {
  const where: Prisma.CountryWhereInput = { deletedAt: null };
  if (params.status) where.status = params.status as Prisma.CountryWhereInput["status"];
  return prisma.country.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }, { code: "asc" }],
    include: { translations: true, _count: { select: { courseMappings: true, prPathways: true } } },
  });
}

export async function getCountry(idOrCode: string) {
  const isCode = idOrCode.length === 2;
  return prisma.country.findFirst({
    where: { deletedAt: null, ...(isCode ? { code: idOrCode.toUpperCase() } : { id: idOrCode }) },
    include: { translations: true },
  });
}

export async function createCountry(input: CountryUpsertInput) {
  return prisma.$transaction(async (tx) => {
    const country = await tx.country.create({
      data: {
        code: input.code.toUpperCase(),
        slug: input.slug,
        flagUrl: input.flagUrl ?? null,
        imageUrl: input.imageUrl ?? null,
        avgTuitionUsd: input.avgTuitionUsd ?? null,
        visaSuccessRate: input.visaSuccessRate ?? null,
        popularity: input.popularity,
        isFeatured: input.isFeatured,
        status: input.status,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      },
    });
    await tx.countryTranslation.createMany({
      data: input.translations.map((t) => ({
        countryId: country.id,
        locale: t.locale,
        name: t.name,
        shortIntro: t.shortIntro ?? null,
        description: t.description ?? null,
      })),
    });
    return country;
  });
}

export async function updateCountry(id: string, input: CountryUpdateInput) {
  const existing = await prisma.country.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error("COUNTRY_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const country = await tx.country.update({
      where: { id },
      data: {
        slug: input.slug ?? existing.slug,
        flagUrl: input.flagUrl === undefined ? existing.flagUrl : input.flagUrl,
        imageUrl: input.imageUrl === undefined ? existing.imageUrl : input.imageUrl,
        avgTuitionUsd:
          input.avgTuitionUsd === undefined ? existing.avgTuitionUsd : input.avgTuitionUsd,
        visaSuccessRate:
          input.visaSuccessRate === undefined ? existing.visaSuccessRate : input.visaSuccessRate,
        popularity: input.popularity ?? existing.popularity,
        isFeatured: input.isFeatured ?? existing.isFeatured,
        status: input.status ?? existing.status,
        publishedAt:
          input.publishedAt === undefined
            ? existing.publishedAt
            : input.publishedAt
              ? new Date(input.publishedAt)
              : null,
      },
    });

    if (input.translations?.length) {
      for (const t of input.translations) {
        await tx.countryTranslation.upsert({
          where: { countryId_locale: { countryId: id, locale: t.locale } },
          create: {
            countryId: id,
            locale: t.locale,
            name: t.name,
            shortIntro: t.shortIntro ?? null,
            description: t.description ?? null,
          },
          update: {
            name: t.name,
            shortIntro: t.shortIntro ?? null,
            description: t.description ?? null,
          },
        });
      }
    }
    return country;
  });
}

export async function deleteCountry(id: string) {
  return prisma.country.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
}

// ── Courses ────────────────────────────────────────────────────────────────

export async function listCourses(params: {
  field?: string;
  level?: string;
  status?: string;
} = {}) {
  const where: Prisma.CourseWhereInput = { deletedAt: null };
  if (params.field) where.field = params.field;
  if (params.level) where.level = params.level as Prisma.CourseWhereInput["level"];
  if (params.status) where.status = params.status as Prisma.CourseWhereInput["status"];
  return prisma.course.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { popularity: "desc" }, { updatedAt: "desc" }],
    include: {
      translations: true,
      _count: { select: { countryMappings: true, outcomes: true } },
    },
  });
}

export async function getCourse(id: string) {
  return prisma.course.findFirst({
    where: { id, deletedAt: null },
    include: {
      translations: true,
      outcomes: { orderBy: { order: "asc" }, include: { translations: true } },
      countryMappings: {
        include: { country: { select: { id: true, code: true, slug: true } } },
      },
    },
  });
}

export async function createCourse(input: CourseUpsertInput) {
  return prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        slug: input.slug,
        code: input.code ?? null,
        level: input.level,
        field: input.field,
        discipline: input.discipline ?? null,
        durationMonths: input.durationMonths ?? null,
        isFeatured: input.isFeatured,
        popularity: input.popularity,
        imageUrl: input.imageUrl ?? null,
        status: input.status,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      },
    });
    if (input.translations.length) {
      await tx.courseTranslation.createMany({
        data: input.translations.map((t) => ({
          courseId: course.id,
          locale: t.locale,
          name: t.name,
          shortIntro: t.shortIntro ?? null,
          description: t.description ?? null,
        })),
      });
    }
    return course;
  });
}

export async function updateCourse(id: string, input: CourseUpdateInput) {
  const existing = await prisma.course.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error("COURSE_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const course = await tx.course.update({
      where: { id },
      data: {
        code: input.code ?? existing.code,
        level: input.level ?? existing.level,
        field: input.field ?? existing.field,
        discipline: input.discipline === undefined ? existing.discipline : input.discipline,
        durationMonths:
          input.durationMonths === undefined ? existing.durationMonths : input.durationMonths,
        isFeatured: input.isFeatured ?? existing.isFeatured,
        popularity: input.popularity ?? existing.popularity,
        imageUrl: input.imageUrl === undefined ? existing.imageUrl : input.imageUrl,
        status: input.status ?? existing.status,
        publishedAt:
          input.publishedAt === undefined
            ? existing.publishedAt
            : input.publishedAt
              ? new Date(input.publishedAt)
              : null,
      },
    });

    if (input.translations?.length) {
      for (const t of input.translations) {
        await tx.courseTranslation.upsert({
          where: { courseId_locale: { courseId: id, locale: t.locale } },
          create: {
            courseId: id,
            locale: t.locale,
            name: t.name,
            shortIntro: t.shortIntro ?? null,
            description: t.description ?? null,
          },
          update: {
            name: t.name,
            shortIntro: t.shortIntro ?? null,
            description: t.description ?? null,
          },
        });
      }
    }
    return course;
  });
}

export async function deleteCourse(id: string) {
  return prisma.course.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
}

// ── Course outcomes ────────────────────────────────────────────────────────

export async function upsertCourseOutcome(input: CourseOutcomeUpsertInput) {
  return prisma.$transaction(async (tx) => {
    // We don't have a natural unique key for outcomes — match on (courseId, occupation).
    const existing = await tx.courseCareerOutcome.findFirst({
      where: { courseId: input.courseId, occupation: input.occupation },
    });

    const outcome = existing
      ? await tx.courseCareerOutcome.update({
          where: { id: existing.id },
          data: {
            anzscoCode: input.anzscoCode ?? null,
            fitScore: input.fitScore,
            order: input.order,
          },
        })
      : await tx.courseCareerOutcome.create({
          data: {
            courseId: input.courseId,
            occupation: input.occupation,
            anzscoCode: input.anzscoCode ?? null,
            fitScore: input.fitScore,
            order: input.order,
          },
        });

    for (const t of input.translations) {
      await tx.courseCareerOutcomeTranslation.upsert({
        where: { outcomeId_locale: { outcomeId: outcome.id, locale: t.locale } },
        create: { outcomeId: outcome.id, locale: t.locale, title: t.title, blurb: t.blurb ?? null },
        update: { title: t.title, blurb: t.blurb ?? null },
      });
    }
    return outcome;
  });
}

export async function deleteCourseOutcome(id: string) {
  return prisma.courseCareerOutcome.delete({ where: { id } });
}

// ── Course-Country mappings ───────────────────────────────────────────────

export async function listMappings(params: { courseId?: string; countryCode?: string } = {}) {
  const where: Prisma.CourseCountryMappingWhereInput = {};
  if (params.courseId) where.courseId = params.courseId;
  if (params.countryCode) {
    const c = await prisma.country.findUnique({
      where: { code: params.countryCode.toUpperCase() },
      select: { id: true },
    });
    if (!c) return [];
    where.countryId = c.id;
  }
  return prisma.courseCountryMapping.findMany({
    where,
    include: {
      course: { select: { id: true, slug: true, field: true, level: true } },
      country: { select: { id: true, code: true, slug: true } },
      prPathwayLinks: { include: { pathway: { select: { id: true, slug: true, type: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertMapping(input: CourseCountryMappingUpsertInput) {
  const country = await prisma.country.findUnique({
    where: { code: input.countryCode.toUpperCase() },
    select: { id: true },
  });
  if (!country) throw new Error("COUNTRY_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const mapping = await tx.courseCountryMapping.upsert({
      where: { courseId_countryId: { courseId: input.courseId, countryId: country.id } },
      create: {
        courseId: input.courseId,
        countryId: country.id,
        avgTuitionUsd: input.avgTuitionUsd ?? null,
        livingCostUsd: input.livingCostUsd ?? null,
        intakeMonths: input.intakeMonths ?? null,
        topUniversities: (input.topUniversities ?? null) as Prisma.InputJsonValue,
        prEligible: input.prEligible,
        graduateVisaMonths: input.graduateVisaMonths ?? null,
        notes: input.notes ?? null,
        isFeatured: input.isFeatured,
      },
      update: {
        avgTuitionUsd: input.avgTuitionUsd ?? null,
        livingCostUsd: input.livingCostUsd ?? null,
        intakeMonths: input.intakeMonths ?? null,
        topUniversities: (input.topUniversities ?? null) as Prisma.InputJsonValue,
        prEligible: input.prEligible,
        graduateVisaMonths: input.graduateVisaMonths ?? null,
        notes: input.notes ?? null,
        isFeatured: input.isFeatured,
      },
    });

    // Replace PR pathway links — admin sends the desired set each time.
    if (input.prPathwayIds) {
      await tx.prPathwayOnCourseMapping.deleteMany({ where: { mappingId: mapping.id } });
      if (input.prPathwayIds.length) {
        await tx.prPathwayOnCourseMapping.createMany({
          data: input.prPathwayIds.map((pid, idx) => ({
            mappingId: mapping.id,
            pathwayId: pid,
            priority: input.prPathwayIds!.length - idx,
          })),
        });
      }
    }
    return mapping;
  });
}

export async function deleteMapping(id: string) {
  return prisma.courseCountryMapping.delete({ where: { id } });
}

// ── PR pathways ────────────────────────────────────────────────────────────

export async function listPrPathways(params: { countryCode?: string; type?: string } = {}) {
  const where: Prisma.PrPathwayWhereInput = { deletedAt: null };
  if (params.type) where.type = params.type as Prisma.PrPathwayWhereInput["type"];
  if (params.countryCode) {
    const c = await prisma.country.findUnique({
      where: { code: params.countryCode.toUpperCase() },
      select: { id: true },
    });
    if (!c) return [];
    where.countryId = c.id;
  }
  return prisma.prPathway.findMany({
    where,
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    include: {
      country: { select: { id: true, code: true, slug: true } },
      translations: true,
      steps: { orderBy: { order: "asc" }, include: { translations: true } },
    },
  });
}

export async function getPrPathway(id: string) {
  return prisma.prPathway.findFirst({
    where: { id, deletedAt: null },
    include: {
      country: true,
      translations: true,
      steps: { orderBy: { order: "asc" }, include: { translations: true } },
    },
  });
}

export async function createPrPathway(input: PrPathwayUpsertInput) {
  const country = await prisma.country.findUnique({
    where: { code: input.countryCode.toUpperCase() },
    select: { id: true },
  });
  if (!country) throw new Error("COUNTRY_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const pathway = await tx.prPathway.create({
      data: {
        slug: input.slug,
        countryId: country.id,
        type: input.type,
        difficulty: input.difficulty,
        minYearsToPr: input.minYearsToPr ?? null,
        pointsRequired: input.pointsRequired ?? null,
        ageLimit: input.ageLimit ?? null,
        englishMinBand: input.englishMinBand ?? null,
        isActive: input.isActive,
        priority: input.priority,
        externalUrl: input.externalUrl ?? null,
      },
    });

    await tx.prPathwayTranslation.createMany({
      data: input.translations.map((t) => ({
        pathwayId: pathway.id,
        locale: t.locale,
        name: t.name,
        summary: t.summary ?? null,
        body: t.body ?? null,
      })),
    });

    if (input.steps?.length) {
      for (const step of input.steps) {
        const s = await tx.prPathwayStep.create({
          data: {
            pathwayId: pathway.id,
            order: step.order,
            durationMonths: step.durationMonths ?? null,
          },
        });
        await tx.prPathwayStepTranslation.createMany({
          data: step.translations.map((t) => ({
            stepId: s.id,
            locale: t.locale,
            title: t.title,
            detail: t.detail ?? null,
          })),
        });
      }
    }
    return pathway;
  });
}

export async function updatePrPathway(id: string, input: PrPathwayUpdateInput) {
  const existing = await prisma.prPathway.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error("PATHWAY_NOT_FOUND");

  const countryId =
    input.countryCode === undefined
      ? existing.countryId
      : await resolveCountryId(input.countryCode, /*required*/ true);

  return prisma.$transaction(async (tx) => {
    const pathway = await tx.prPathway.update({
      where: { id },
      data: {
        countryId: countryId!,
        type: input.type ?? existing.type,
        difficulty: input.difficulty ?? existing.difficulty,
        minYearsToPr:
          input.minYearsToPr === undefined ? existing.minYearsToPr : input.minYearsToPr,
        pointsRequired:
          input.pointsRequired === undefined ? existing.pointsRequired : input.pointsRequired,
        ageLimit: input.ageLimit === undefined ? existing.ageLimit : input.ageLimit,
        englishMinBand:
          input.englishMinBand === undefined ? existing.englishMinBand : input.englishMinBand,
        isActive: input.isActive ?? existing.isActive,
        priority: input.priority ?? existing.priority,
        externalUrl: input.externalUrl === undefined ? existing.externalUrl : input.externalUrl,
      },
    });

    if (input.translations?.length) {
      for (const t of input.translations) {
        await tx.prPathwayTranslation.upsert({
          where: { pathwayId_locale: { pathwayId: id, locale: t.locale } },
          create: {
            pathwayId: id,
            locale: t.locale,
            name: t.name,
            summary: t.summary ?? null,
            body: t.body ?? null,
          },
          update: { name: t.name, summary: t.summary ?? null, body: t.body ?? null },
        });
      }
    }

    // Steps: replace-all semantics for simplicity (counts are small).
    if (input.steps) {
      await tx.prPathwayStep.deleteMany({ where: { pathwayId: id } });
      for (const step of input.steps) {
        const s = await tx.prPathwayStep.create({
          data: {
            pathwayId: id,
            order: step.order,
            durationMonths: step.durationMonths ?? null,
          },
        });
        await tx.prPathwayStepTranslation.createMany({
          data: step.translations.map((t) => ({
            stepId: s.id,
            locale: t.locale,
            title: t.title,
            detail: t.detail ?? null,
          })),
        });
      }
    }
    return pathway;
  });
}

export async function deletePrPathway(id: string) {
  return prisma.prPathway.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

// ── Salary estimates ───────────────────────────────────────────────────────

export async function listSalaryEstimates(params: { courseId?: string; countryCode?: string } = {}) {
  const where: Prisma.SalaryEstimateWhereInput = {};
  if (params.courseId) where.courseId = params.courseId;
  if (params.countryCode) {
    const c = await prisma.country.findUnique({
      where: { code: params.countryCode.toUpperCase() },
      select: { id: true },
    });
    if (!c) return [];
    where.countryId = c.id;
  }
  return prisma.salaryEstimate.findMany({
    where,
    include: { country: { select: { code: true, slug: true } }, course: { select: { slug: true, field: true } } },
    orderBy: [{ effectiveYear: "desc" }, { level: "asc" }],
  });
}

export async function upsertSalaryEstimate(input: SalaryEstimateUpsertInput) {
  const country = await prisma.country.findUnique({
    where: { code: input.countryCode.toUpperCase() },
    select: { id: true },
  });
  if (!country) throw new Error("COUNTRY_NOT_FOUND");

  // Composite uniqueness includes nullable fields — Prisma can't `upsert` on
  // those, so do a find-then-write.
  const existing = await prisma.salaryEstimate.findFirst({
    where: {
      courseId: input.courseId ?? null,
      countryId: country.id,
      occupation: input.occupation ?? null,
      level: input.level,
      effectiveYear: input.effectiveYear,
    },
  });

  const data = {
    courseId: input.courseId ?? null,
    countryId: country.id,
    occupation: input.occupation ?? null,
    level: input.level,
    period: input.period,
    currency: input.currency,
    minAmount: input.minAmount,
    midAmount: input.midAmount,
    maxAmount: input.maxAmount,
    effectiveYear: input.effectiveYear,
    source: input.source ?? null,
    notes: input.notes ?? null,
  };

  return existing
    ? prisma.salaryEstimate.update({ where: { id: existing.id }, data })
    : prisma.salaryEstimate.create({ data });
}

export async function deleteSalaryEstimate(id: string) {
  return prisma.salaryEstimate.delete({ where: { id } });
}

// ── Demand signals ─────────────────────────────────────────────────────────

export async function listDemandSignals(params: { courseId?: string; countryCode?: string } = {}) {
  const where: Prisma.DemandSignalWhereInput = {};
  if (params.courseId) where.courseId = params.courseId;
  if (params.countryCode) {
    const c = await prisma.country.findUnique({
      where: { code: params.countryCode.toUpperCase() },
      select: { id: true },
    });
    if (!c) return [];
    where.countryId = c.id;
  }
  return prisma.demandSignal.findMany({
    where,
    include: {
      country: { select: { code: true, slug: true } },
      course: { select: { slug: true, field: true } },
    },
    orderBy: [{ effectiveYear: "desc" }, { createdAt: "desc" }],
  });
}

export async function upsertDemandSignal(input: DemandSignalUpsertInput) {
  const country = await prisma.country.findUnique({
    where: { code: input.countryCode.toUpperCase() },
    select: { id: true },
  });
  if (!country) throw new Error("COUNTRY_NOT_FOUND");

  const existing = await prisma.demandSignal.findFirst({
    where: {
      courseId: input.courseId ?? null,
      countryId: country.id,
      occupation: input.occupation ?? null,
      effectiveYear: input.effectiveYear,
    },
  });

  const data = {
    courseId: input.courseId ?? null,
    countryId: country.id,
    occupation: input.occupation ?? null,
    demandLevel: input.demandLevel,
    shortageListed: input.shortageListed,
    vacancies12mo: input.vacancies12mo ?? null,
    growthPercent: input.growthPercent ?? null,
    effectiveYear: input.effectiveYear,
    source: input.source ?? null,
    notes: input.notes ?? null,
  };

  return existing
    ? prisma.demandSignal.update({ where: { id: existing.id }, data })
    : prisma.demandSignal.create({ data });
}

export async function deleteDemandSignal(id: string) {
  return prisma.demandSignal.delete({ where: { id } });
}

// ── Career trends ──────────────────────────────────────────────────────────

export async function listCareerTrends(params: { courseId?: string; countryCode?: string } = {}) {
  const where: Prisma.CareerTrendWhereInput = {};
  if (params.courseId) where.courseId = params.courseId;
  if (params.countryCode) {
    const c = await prisma.country.findUnique({
      where: { code: params.countryCode.toUpperCase() },
      select: { id: true },
    });
    if (!c) return [];
    where.countryId = c.id;
  }
  return prisma.careerTrend.findMany({
    where,
    include: {
      country: { select: { code: true, slug: true } },
      course: { select: { slug: true, field: true } },
    },
    orderBy: { year: "desc" },
  });
}

export async function upsertCareerTrend(input: CareerTrendUpsertInput) {
  const countryId =
    input.countryCode === undefined || input.countryCode === null
      ? null
      : await resolveCountryId(input.countryCode, true);
  return prisma.careerTrend.create({
    data: {
      courseId: input.courseId ?? null,
      countryId: countryId ?? null,
      occupation: input.occupation ?? null,
      year: input.year,
      direction: input.direction,
      metric: input.metric,
      value: input.value,
      notes: input.notes ?? null,
    },
  });
}

export async function deleteCareerTrend(id: string) {
  return prisma.careerTrend.delete({ where: { id } });
}

// ── Weights + buckets (SiteSetting) ───────────────────────────────────────

const WEIGHTS_KEY = "career.weights";
const BUCKETS_KEY = "career.buckets";

export async function getCategoryWeightsSetting() {
  return prisma.siteSetting.findUnique({ where: { key: WEIGHTS_KEY } });
}

export async function setCategoryWeights(input: CareerCategoryWeightsInput) {
  return prisma.siteSetting.upsert({
    where: { key: WEIGHTS_KEY },
    create: {
      key: WEIGHTS_KEY,
      group: "career",
      type: "json",
      value: input as unknown as Prisma.InputJsonValue,
      isPublic: false,
    },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
}

export async function getScoreBucketsSetting() {
  return prisma.siteSetting.findUnique({ where: { key: BUCKETS_KEY } });
}

export async function setScoreBuckets(input: CareerScoreBucketsInput) {
  return prisma.siteSetting.upsert({
    where: { key: BUCKETS_KEY },
    create: {
      key: BUCKETS_KEY,
      group: "career",
      type: "json",
      value: input as unknown as Prisma.InputJsonValue,
      isPublic: false,
    },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
}

// ── Preview ────────────────────────────────────────────────────────────────

export async function previewRecommendations(
  profile: CareerProfile,
  opts: RecommendOptions = {},
) {
  return recommend(profile, opts);
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function resolveCountryId(
  code: string | null | undefined,
  required: boolean,
): Promise<string | null> {
  if (code === null || code === undefined) {
    if (required) throw new Error("COUNTRY_REQUIRED");
    return null;
  }
  const c = await prisma.country.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true },
  });
  if (!c) throw new Error("COUNTRY_NOT_FOUND");
  return c.id;
}

// Re-export types for admin route convenience.
export type { CareerCategory };
