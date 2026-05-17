import { z } from "zod";

const slugSchema = z
  .string()
  .min(1).max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only");

const codeSchema = z
  .string()
  .length(2, "ISO 3166-1 alpha-2 code (2 letters)")
  .regex(/^[A-Za-z]{2}$/, "Two letters only");

export const countryUpsertSchema = z.object({
  code: codeSchema,
  slug: slugSchema,
  flagUrl: z.string().url().optional().nullable().or(z.literal("")),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  avgTuitionUsd: z.coerce.number().int().nonnegative().optional().nullable(),
  visaSuccessRate: z.coerce.number().min(0).max(1).optional().nullable(),
  popularity: z.coerce.number().int().nonnegative().default(0),
  isFeatured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  name: z.string().min(1).max(120),
  shortIntro: z.string().max(300).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
});

export type CountryUpsertInput = z.infer<typeof countryUpsertSchema>;
