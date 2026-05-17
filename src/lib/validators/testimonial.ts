import { z } from "zod";

export const testimonialUpsertSchema = z.object({
  studentName: z.string().min(1).max(120),
  studentPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
  universityName: z.string().max(200).optional().nullable(),
  programName: z.string().max(200).optional().nullable(),
  intakeYear: z.coerce.number().int().min(1980).max(2100).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  isFeatured: z.boolean().default(false),
  countryId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  quote: z.string().min(1).max(2000),
  studentTitle: z.string().max(200).optional().nullable(),
});

export type TestimonialUpsertInput = z.infer<typeof testimonialUpsertSchema>;
