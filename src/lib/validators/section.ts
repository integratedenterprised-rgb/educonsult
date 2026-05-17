/**
 * Section validators — one `data` schema per block type, then combined into a
 * discriminated union by `type`. Used by both the admin API (server-side
 * input validation) and the editor forms (client-side via @hookform/resolvers).
 */
import { z } from "zod";

// ── Common bits ─────────────────────────────────────────────────────────────

const ctaSchema = z
  .object({
    label: z.string().min(1).max(80),
    url: z.string().min(1).max(2048),
  })
  .optional();

export const sectionSettingsSchema = z
  .object({
    paddingY: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
    background: z.enum(["default", "muted", "primary", "card"]).optional(),
    containerWidth: z.enum(["narrow", "default", "wide", "full"]).optional(),
  })
  .optional();

// ── Per-block data schemas ──────────────────────────────────────────────────

export const heroDataSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  headline: z.string().min(1, "Headline is required").max(200),
  subheadline: z.string().max(500).optional(),
  backgroundImage: z.string().url().optional().or(z.literal("")),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
});

export const richTextDataSchema = z.object({
  html: z.string().min(1, "Content cannot be empty"),
});

export const ctaDataSchema = z.object({
  heading: z.string().min(1, "Heading is required").max(200),
  body: z.string().max(500).optional(),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
});

export const countryGridDataSchema = z.object({
  heading: z.string().max(200).optional(),
  countries: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        flagUrl: z.string().url().optional().or(z.literal("")),
        href: z.string().min(1).max(2048),
      }),
    )
    .max(60),
});

export const testimonialsDataSchema = z.object({
  heading: z.string().max(200).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        quote: z.string().min(1).max(1000),
        title: z.string().max(200).optional(),
        photoUrl: z.string().url().optional().or(z.literal("")),
      }),
    )
    .max(40),
});

export const statsDataSchema = z.object({
  heading: z.string().max(200).optional(),
  items: z
    .array(
      z.object({
        value: z.string().min(1).max(40),
        label: z.string().min(1).max(120),
      }),
    )
    .max(12),
});

export const faqDataSchema = z.object({
  heading: z.string().max(200).optional(),
  items: z
    .array(
      z.object({
        q: z.string().min(1).max(300),
        a: z.string().min(1).max(2000),
      }),
    )
    .max(40),
});

export const leadFormDataSchema = z.object({
  formKey: z.string().min(1).max(80),
  heading: z.string().max(200).optional(),
  subheading: z.string().max(500).optional(),
});

export const eligibilityDataSchema = z.object({
  heading: z.string().max(200).optional(),
  subheading: z.string().max(500).optional(),
  criteria: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        description: z.string().max(400).optional(),
        iconKey: z.string().max(64).optional(),
      }),
    )
    .max(12),
  ctaLabel: z.string().max(80).optional(),
  ctaUrl: z.string().max(2048).optional(),
});

export const visaRiskDataSchema = z.object({
  heading: z.string().max(200).optional(),
  subheading: z.string().max(500).optional(),
  factors: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        description: z.string().max(400).optional(),
        severity: z.enum(["low", "medium", "high"]),
      }),
    )
    .max(12),
  ctaLabel: z.string().max(80).optional(),
  ctaUrl: z.string().max(2048).optional(),
});

export const coursePathwaysDataSchema = z.object({
  heading: z.string().max(200).optional(),
  subheading: z.string().max(500).optional(),
  pathways: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        level: z.string().min(1).max(40),
        field: z.string().min(1).max(120),
        countryName: z.string().max(80).optional(),
        durationMonths: z.number().int().min(1).max(180).optional(),
        avgTuitionUsd: z.number().int().min(0).max(500_000).optional(),
        href: z.string().min(1).max(2048),
      }),
    )
    .max(40),
});

export const resourcesDataSchema = z.object({
  heading: z.string().max(200).optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(400).optional(),
        type: z.enum(["PDF", "VIDEO", "ARTICLE", "CHECKLIST", "TEMPLATE", "EXTERNAL_LINK"]),
        href: z.string().min(1).max(2048),
        thumbnailUrl: z.string().url().optional().or(z.literal("")),
      }),
    )
    .max(40),
});

// ── Discriminated section union ─────────────────────────────────────────────

const baseSectionFields = {
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  isVisible: z.boolean().optional(),
  anchor: z.string().max(80).optional(),
  settings: sectionSettingsSchema,
};

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({ ...baseSectionFields, type: z.literal("hero"), data: heroDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("richText"), data: richTextDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("cta"), data: ctaDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("countryGrid"), data: countryGridDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("eligibility"), data: eligibilityDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("visaRisk"), data: visaRiskDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("coursePathways"), data: coursePathwaysDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("resources"), data: resourcesDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("testimonials"), data: testimonialsDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("stats"), data: statsDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("faq"), data: faqDataSchema }),
  z.object({ ...baseSectionFields, type: z.literal("leadForm"), data: leadFormDataSchema }),
]);

export const sectionsSchema = z.array(sectionSchema).max(120);

export type SectionInput = z.infer<typeof sectionSchema>;
