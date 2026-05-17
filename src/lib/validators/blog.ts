/**
 * Blog validators.
 *
 * One module covers:
 *   - posts (create, update, status transitions)
 *   - FAQ entries
 *   - CTA slots (with placement-conditional fields)
 *   - per-post internal-link rules
 *   - categories, tags, authors
 *
 * Shapes are kept close to the Prisma rows so service layer can pass them
 * through with minimal mapping. SEO fields piggyback the page conventions
 * (see lib/validators/page.ts) — `seoTitle/Description/Keywords/ogImageUrl`.
 */
import { z } from "zod";

// ── Shared ──────────────────────────────────────────────────────────────────

export const blogSlugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");

export const contentStatusSchema = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]);
export const blogBodyFormatSchema = z.enum(["HTML", "MDX", "LEXICAL_JSON"]);

export const blogCtaPlacementSchema = z.enum([
  "AFTER_INTRO",
  "AFTER_HEADING",
  "END_OF_POST",
  "SIDEBAR",
  "AFTER_PARAGRAPH",
]);
export const blogCtaVariantSchema = z.enum(["INLINE", "CARD", "BANNER", "LEAD_FORM"]);

const optionalUrl = z.string().url().optional().nullable().or(z.literal(""));
const optionalStr = (max: number) => z.string().max(max).optional().nullable();

// ── FAQ ─────────────────────────────────────────────────────────────────────

export const blogFaqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, "Question is required").max(300),
  answer: z.string().min(1, "Answer is required").max(4000),
  order: z.number().int().min(0).default(0),
});
export type BlogFaqInput = z.infer<typeof blogFaqSchema>;

// ── CTA slots ───────────────────────────────────────────────────────────────

export const blogCtaSchema = z
  .object({
    id: z.string().optional(),
    placement: blogCtaPlacementSchema,
    variant: blogCtaVariantSchema.default("CARD"),
    anchor: optionalStr(120),
    paragraphIndex: z.number().int().min(0).max(500).optional().nullable(),
    heading: z.string().min(1, "Heading is required").max(200),
    body: optionalStr(800),
    primaryLabel: optionalStr(80),
    primaryUrl: optionalStr(2048),
    secondaryLabel: optionalStr(80),
    secondaryUrl: optionalStr(2048),
    formKey: optionalStr(80),
    backgroundImage: optionalUrl,
    isVisible: z.boolean().default(true),
    order: z.number().int().min(0).default(0),
  })
  .superRefine((cta, ctx) => {
    if (cta.placement === "AFTER_HEADING" && !cta.anchor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anchor"],
        message: "Anchor is required when placement is AFTER_HEADING",
      });
    }
    if (cta.placement === "AFTER_PARAGRAPH" && (cta.paragraphIndex == null || cta.paragraphIndex < 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paragraphIndex"],
        message: "Paragraph index is required when placement is AFTER_PARAGRAPH",
      });
    }
    if (cta.variant === "LEAD_FORM" && !cta.formKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["formKey"],
        message: "Form key is required for LEAD_FORM variant",
      });
    }
  });
export type BlogCtaInput = z.infer<typeof blogCtaSchema>;

// ── Internal-link rules ─────────────────────────────────────────────────────

export const blogInternalLinkSchema = z.object({
  id: z.string().optional(),
  keyword: z.string().min(2, "Keyword must be at least 2 characters").max(120),
  url: z.string().min(1, "URL is required").max(2048),
  titleAttr: optionalStr(200),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});
export type BlogInternalLinkInput = z.infer<typeof blogInternalLinkSchema>;

// ── Post create / update ────────────────────────────────────────────────────

export const blogPostCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: blogSlugSchema,
  excerpt: optionalStr(500),
  authorId: optionalStr(80),
});
export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>;

export const blogPostUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: blogSlugSchema,
  excerpt: optionalStr(500),
  body: z.string().default(""),
  bodyFormat: blogBodyFormatSchema.default("HTML"),
  coverImageUrl: optionalUrl,
  coverImageAlt: optionalStr(200),
  status: contentStatusSchema,
  scheduledAt: z.string().datetime().optional().nullable(),
  isFeatured: z.boolean().default(false),
  authorId: optionalStr(80),

  categoryIds: z.array(z.string()).max(20).default([]),
  tagIds: z.array(z.string()).max(40).default([]),
  relatedPostIds: z.array(z.string()).max(12).default([]),

  faqs: z.array(blogFaqSchema).max(40).default([]),
  ctaSlots: z.array(blogCtaSchema).max(20).default([]),
  internalLinks: z.array(blogInternalLinkSchema).max(80).default([]),

  // SEO fields piggyback the same shape pages use.
  seoTitle: optionalStr(200),
  seoDescription: optionalStr(500),
  seoKeywords: optionalStr(400),
  ogImageUrl: optionalUrl,
});
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;

// ── Categories, tags, authors ───────────────────────────────────────────────

export const categoryUpsertSchema = z.object({
  id: z.string().optional(),
  slug: blogSlugSchema,
  name: z.string().min(1).max(120),
  description: optionalStr(500),
  iconUrl: optionalUrl,
  parentId: optionalStr(80),
  order: z.number().int().min(0).default(0),
  seoTitle: optionalStr(200),
  seoDescription: optionalStr(500),
  ogImageUrl: optionalUrl,
});
export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;

export const tagUpsertSchema = z.object({
  id: z.string().optional(),
  slug: blogSlugSchema,
  name: z.string().min(1).max(80),
});
export type TagUpsertInput = z.infer<typeof tagUpsertSchema>;

export const authorUpsertSchema = z.object({
  id: z.string().optional(),
  slug: blogSlugSchema,
  name: z.string().min(1).max(120),
  title: optionalStr(120),
  bio: optionalStr(2000),
  avatarUrl: optionalUrl,
  email: z.string().email().optional().nullable().or(z.literal("")),
  twitter: optionalStr(80),
  linkedin: optionalStr(200),
});
export type AuthorUpsertInput = z.infer<typeof authorUpsertSchema>;
