import { z } from "zod";

export const seoUpsertSchema = z.object({
  targetType: z.enum(["page", "post", "country", "category", "resource", "pathway", "course", "prPathway"]),
  targetId: z.string().min(1),
  locale: z.enum(["EN", "NE", "HI", "ZH"]).default("EN"),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  keywords: z.string().max(400).optional().nullable(),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(500).optional().nullable(),
  ogImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  canonicalUrl: z.string().url().optional().nullable().or(z.literal("")),
  robots: z.string().max(80).optional().nullable(),
  twitterCardType: z.string().max(80).optional().nullable(),
  structuredData: z.unknown().optional(),
});

export type SeoUpsertInput = z.infer<typeof seoUpsertSchema>;
