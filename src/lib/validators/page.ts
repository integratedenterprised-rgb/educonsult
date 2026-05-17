import { z } from "zod";
import { sectionsSchema } from "./section";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/, "Use lowercase letters, numbers, and hyphens; '/' allowed");

export const pageCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: slugSchema,
  template: z.string().max(40).optional().nullable(),
  isHomepage: z.boolean().optional(),
});

export const pageUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: slugSchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  template: z.string().max(40).optional().nullable(),
  isHomepage: z.boolean(),

  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  seoKeywords: z.string().max(400).optional().nullable(),
  ogImageUrl: z.string().url().optional().nullable().or(z.literal("")),

  sections: sectionsSchema,
});

export type PageCreateInput = z.infer<typeof pageCreateSchema>;
export type PageUpdateInput = z.infer<typeof pageUpdateSchema>;
