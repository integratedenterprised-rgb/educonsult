import { z } from "zod";

const RESOURCE_TYPES = ["PDF", "VIDEO", "ARTICLE", "CHECKLIST", "TEMPLATE", "EXTERNAL_LINK"] as const;

export const resourceUpsertSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  type: z.enum(RESOURCE_TYPES),
  fileUrl: z.string().url().optional().nullable().or(z.literal("")),
  externalUrl: z.string().url().optional().nullable().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().nullable().or(z.literal("")),
  fileSize: z.coerce.number().int().nonnegative().optional().nullable(),
  pageCount: z.coerce.number().int().nonnegative().optional().nullable(),
  gated: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().nullable(),
});

export type ResourceUpsertInput = z.infer<typeof resourceUpsertSchema>;
