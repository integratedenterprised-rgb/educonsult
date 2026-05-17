/**
 * Career engine validators.
 *
 * Three groups:
 *   1. Public — `careerRecommendSchema` for the recommendation endpoint.
 *   2. Admin  — CRUD validators for courses, mappings, PR pathways, salary,
 *               demand, and trends.
 *   3. Settings — `career.weights` and `career.buckets` admin updates.
 */
import { z } from "zod";

export const localeSchema = z.enum(["EN", "NE", "HI", "ZH"]);
export const contentStatusSchema = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]);

export const courseLevelSchema = z.enum([
  "CERTIFICATE",
  "DIPLOMA",
  "ADVANCED_DIPLOMA",
  "BACHELORS",
  "MASTERS",
  "PHD",
]);
export type CourseLevelValue = z.infer<typeof courseLevelSchema>;

export const demandLevelSchema = z.enum([
  "VERY_LOW",
  "LOW",
  "MODERATE",
  "HIGH",
  "VERY_HIGH",
]);
export const careerLevelSchema = z.enum(["ENTRY", "MID", "SENIOR", "LEAD"]);
export const salaryPeriodSchema = z.enum(["HOURLY", "MONTHLY", "YEARLY"]);

export const prPathwayTypeSchema = z.enum([
  "POST_STUDY_WORK",
  "GRADUATE_VISA",
  "SKILLED_INDEPENDENT",
  "EMPLOYER_SPONSORED",
  "REGIONAL",
  "EXPRESS_ENTRY",
  "INVESTOR",
  "FAMILY",
  "OTHER",
]);
export const prDifficultySchema = z.enum(["EASY", "MODERATE", "HARD", "VERY_HARD"]);
export const trendDirectionSchema = z.enum(["GROWING", "STABLE", "DECLINING"]);

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase kebab-case slug");

// ── Public recommendation ──────────────────────────────────────────────────

export const careerProfileSchema = z.object({
  interestedFields: z.array(z.string().trim().min(1).max(80)).max(10).optional().nullable(),
  interestedOccupations: z.array(z.string().trim().min(1).max(80)).max(10).optional().nullable(),
  discipline: z.string().trim().max(40).optional().nullable(),
  preferredLevels: z.array(courseLevelSchema).max(6).optional().nullable(),
  preferredCountries: z.array(z.string().length(2)).max(10).optional().nullable(),
  preferredIntake: z.string().trim().max(60).optional().nullable(),
  maxDurationMonths: z.number().int().min(1).max(120).optional().nullable(),
  prGoalWeight: z.number().min(0).max(1).optional().nullable(),
  salaryGoalWeight: z.number().min(0).max(1).optional().nullable(),
  budgetUsd: z.number().min(0).max(10_000_000).optional().nullable(),
  fundingSource: z.string().trim().max(40).optional().nullable(),
  gpa: z.number().min(0).max(100).optional().nullable(),
  gpaScale: z.union([z.literal(4), z.literal(10), z.literal(100)]).optional().nullable(),
  educationLevel: z.string().trim().max(80).optional().nullable(),
  workExperienceYears: z.number().min(0).max(60).optional().nullable(),
  ielts: z.number().min(0).max(9).optional().nullable(),
  toefl: z.number().min(0).max(120).optional().nullable(),
  pte: z.number().min(0).max(90).optional().nullable(),
  duolingo: z.number().min(0).max(160).optional().nullable(),
  age: z.number().min(10).max(100).optional().nullable(),
  extras: z.record(z.string(), z.unknown()).optional(),
});

export const careerRecommendSchema = z.object({
  profile: careerProfileSchema,
  locale: localeSchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
  captureLead: z.boolean().optional().default(false),
  contact: z
    .object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().max(80).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(6).max(24).optional(),
      whatsapp: z.string().min(6).max(24).optional(),
      consentMarketing: z.boolean().optional(),
    })
    .optional(),
});
export type CareerRecommendInput = z.infer<typeof careerRecommendSchema>;

// ── Translations (shared shapes) ───────────────────────────────────────────

export const courseTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string().trim().min(1).max(200),
  shortIntro: z.string().trim().max(400).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
});

export const namedTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(400).optional().nullable(),
  body: z.string().trim().max(4000).optional().nullable(),
});

// ── Admin: Course CRUD ─────────────────────────────────────────────────────

export const courseUpsertSchema = z.object({
  slug: slugSchema,
  code: z.string().trim().max(40).optional().nullable(),
  level: courseLevelSchema,
  field: z.string().trim().min(1).max(120),
  discipline: z.string().trim().max(60).optional().nullable(),
  durationMonths: z.number().int().min(1).max(120).optional().nullable(),
  isFeatured: z.boolean().default(false),
  popularity: z.number().int().min(0).max(10_000).default(0),
  imageUrl: z.string().url().max(800).optional().nullable(),
  status: contentStatusSchema.default("DRAFT"),
  publishedAt: z.string().datetime().optional().nullable(),
  translations: z.array(courseTranslationSchema).min(1).max(4),
});
export type CourseUpsertInput = z.infer<typeof courseUpsertSchema>;

export const courseUpdateSchema = courseUpsertSchema.omit({ slug: true }).partial();
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;

// ── Admin: Course-Country mapping ──────────────────────────────────────────

const universitySchema = z.object({
  name: z.string().trim().min(1).max(200),
  rank: z.number().int().min(1).max(10_000).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  url: z.string().url().max(800).optional().nullable(),
});

export const courseCountryMappingUpsertSchema = z.object({
  courseId: z.string().min(1),
  countryCode: z.string().length(2),
  avgTuitionUsd: z.number().int().min(0).max(500_000).optional().nullable(),
  livingCostUsd: z.number().int().min(0).max(200_000).optional().nullable(),
  intakeMonths: z.string().trim().max(120).optional().nullable(),
  topUniversities: z.array(universitySchema).max(20).optional().nullable(),
  prEligible: z.boolean().default(false),
  graduateVisaMonths: z.number().int().min(0).max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  isFeatured: z.boolean().default(false),
  prPathwayIds: z.array(z.string().min(1)).max(20).optional(),
});
export type CourseCountryMappingUpsertInput = z.infer<typeof courseCountryMappingUpsertSchema>;

// ── Admin: PR pathway CRUD ─────────────────────────────────────────────────

export const prStepSchema = z.object({
  order: z.number().int().min(0).max(100),
  durationMonths: z.number().int().min(0).max(120).optional().nullable(),
  translations: z
    .array(
      z.object({
        locale: localeSchema,
        title: z.string().trim().min(1).max(200),
        detail: z.string().trim().max(2000).optional().nullable(),
      }),
    )
    .min(1)
    .max(4),
});

export const prPathwayUpsertSchema = z.object({
  slug: slugSchema,
  countryCode: z.string().length(2),
  type: prPathwayTypeSchema,
  difficulty: prDifficultySchema.default("MODERATE"),
  minYearsToPr: z.number().int().min(0).max(20).optional().nullable(),
  pointsRequired: z.number().int().min(0).max(200).optional().nullable(),
  ageLimit: z.number().int().min(16).max(80).optional().nullable(),
  englishMinBand: z.number().min(0).max(9).optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(1000).default(0),
  externalUrl: z.string().url().max(800).optional().nullable(),
  translations: z.array(namedTranslationSchema).min(1).max(4),
  steps: z.array(prStepSchema).max(20).optional(),
});
export type PrPathwayUpsertInput = z.infer<typeof prPathwayUpsertSchema>;

export const prPathwayUpdateSchema = prPathwayUpsertSchema.omit({ slug: true }).partial();
export type PrPathwayUpdateInput = z.infer<typeof prPathwayUpdateSchema>;

// ── Admin: Salary, Demand, Trend ───────────────────────────────────────────

export const salaryEstimateUpsertSchema = z.object({
  courseId: z.string().min(1).optional().nullable(),
  countryCode: z.string().length(2),
  occupation: z.string().trim().max(120).optional().nullable(),
  level: careerLevelSchema,
  period: salaryPeriodSchema.default("YEARLY"),
  currency: z.string().trim().min(3).max(3).default("USD"),
  minAmount: z.number().int().min(0).max(10_000_000),
  midAmount: z.number().int().min(0).max(10_000_000),
  maxAmount: z.number().int().min(0).max(10_000_000),
  effectiveYear: z.number().int().min(2000).max(2100),
  source: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export type SalaryEstimateUpsertInput = z.infer<typeof salaryEstimateUpsertSchema>;

export const demandSignalUpsertSchema = z.object({
  courseId: z.string().min(1).optional().nullable(),
  countryCode: z.string().length(2),
  occupation: z.string().trim().max(120).optional().nullable(),
  demandLevel: demandLevelSchema,
  shortageListed: z.boolean().default(false),
  vacancies12mo: z.number().int().min(0).max(10_000_000).optional().nullable(),
  growthPercent: z.number().min(-100).max(1000).optional().nullable(),
  effectiveYear: z.number().int().min(2000).max(2100),
  source: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export type DemandSignalUpsertInput = z.infer<typeof demandSignalUpsertSchema>;

export const careerTrendUpsertSchema = z.object({
  courseId: z.string().min(1).optional().nullable(),
  countryCode: z.string().length(2).optional().nullable(),
  occupation: z.string().trim().max(120).optional().nullable(),
  year: z.number().int().min(2000).max(2100),
  direction: trendDirectionSchema,
  metric: z.string().trim().min(1).max(60),
  value: z.number(),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export type CareerTrendUpsertInput = z.infer<typeof careerTrendUpsertSchema>;

// ── Admin: Course outcomes ─────────────────────────────────────────────────

export const courseOutcomeUpsertSchema = z.object({
  courseId: z.string().min(1),
  occupation: z.string().trim().min(1).max(120),
  anzscoCode: z.string().trim().max(40).optional().nullable(),
  fitScore: z.number().int().min(0).max(100).default(70),
  order: z.number().int().min(0).max(100).default(0),
  translations: z
    .array(
      z.object({
        locale: localeSchema,
        title: z.string().trim().min(1).max(200),
        blurb: z.string().trim().max(800).optional().nullable(),
      }),
    )
    .min(1)
    .max(4),
});
export type CourseOutcomeUpsertInput = z.infer<typeof courseOutcomeUpsertSchema>;

// ── Settings ───────────────────────────────────────────────────────────────

export const careerCategoryWeightsSchema = z.object({
  interest: z.number().min(0).max(5),
  country: z.number().min(0).max(5),
  demand: z.number().min(0).max(5),
  pr: z.number().min(0).max(5),
  salary: z.number().min(0).max(5),
  budget: z.number().min(0).max(5),
});
export type CareerCategoryWeightsInput = z.infer<typeof careerCategoryWeightsSchema>;

// ── Admin: Country CRUD (career-engine scoped) ────────────────────────────
//
// The career engine reads `Country` for the destination economics it shows
// alongside courses. The base CMS doesn't yet expose admin routes for
// Country so we surface a minimal CRUD here. Keep it narrow: just the
// fields the engine + recommendation cards actually consume.

export const countryTranslationSchema = z.object({
  locale: localeSchema,
  name: z.string().trim().min(1).max(200),
  shortIntro: z.string().trim().max(400).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
});

export const countryUpsertSchema = z.object({
  code: z.string().length(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase kebab-case slug"),
  flagUrl: z.string().url().max(800).optional().nullable(),
  imageUrl: z.string().url().max(800).optional().nullable(),
  avgTuitionUsd: z.number().int().min(0).max(500_000).optional().nullable(),
  visaSuccessRate: z.number().min(0).max(1).optional().nullable(),
  popularity: z.number().int().min(0).max(10_000).default(0),
  isFeatured: z.boolean().default(false),
  status: contentStatusSchema.default("DRAFT"),
  publishedAt: z.string().datetime().optional().nullable(),
  translations: z.array(countryTranslationSchema).min(1).max(4),
});
export type CountryUpsertInput = z.infer<typeof countryUpsertSchema>;

export const countryUpdateSchema = countryUpsertSchema.omit({ code: true }).partial();
export type CountryUpdateInput = z.infer<typeof countryUpdateSchema>;

export const careerScoreBucketsSchema = z
  .object({
    good: z.number().int().min(0).max(100),
    strong: z.number().int().min(0).max(100),
    excellent: z.number().int().min(0).max(100),
  })
  .refine((b) => b.good < b.strong && b.strong < b.excellent, {
    message: "Buckets must be strictly ascending (good < strong < excellent)",
  });
export type CareerScoreBucketsInput = z.infer<typeof careerScoreBucketsSchema>;
