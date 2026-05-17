/**
 * Display metadata + default values per section type.
 *
 * The editor reads this when adding a new section so each block starts with a
 * sensible empty shape (one testimonial item, one stat, etc.) rather than an
 * empty array that the user has to bootstrap manually.
 */
import type { Section, SectionType } from "@/types/cms";

interface BlockMeta {
  type: SectionType;
  label: string;
  description: string;
  defaultData: Section["data"];
}

export const BLOCK_META: Record<SectionType, BlockMeta> = {
  hero: {
    type: "hero",
    label: "Hero",
    description: "Full-width hero with headline and CTAs",
    defaultData: { headline: "New headline" },
  },
  richText: {
    type: "richText",
    label: "Rich text",
    description: "Long-form HTML content",
    defaultData: { html: "<p>Start writing…</p>" },
  },
  cta: {
    type: "cta",
    label: "CTA banner",
    description: "Bold call-to-action with one or two buttons",
    defaultData: { heading: "Ready to start?" },
  },
  countryGrid: {
    type: "countryGrid",
    label: "Country grid",
    description: "Grid of destination countries with flags",
    defaultData: { heading: "Where will you go?", countries: [] },
  },
  eligibility: {
    type: "eligibility",
    label: "Eligibility",
    description: "Criteria checklist + CTA to the eligibility tool",
    defaultData: { heading: "Are you eligible?", criteria: [] },
  },
  visaRisk: {
    type: "visaRisk",
    label: "Visa risk",
    description: "Factors that affect a student's visa approval probability",
    defaultData: { heading: "What affects your visa risk", factors: [] },
  },
  coursePathways: {
    type: "coursePathways",
    label: "Course pathways",
    description: "Curated pathway cards (destination × level × field)",
    defaultData: { heading: "Top study pathways", pathways: [] },
  },
  resources: {
    type: "resources",
    label: "Resources",
    description: "PDFs, videos, checklists, templates linked from cards",
    defaultData: { heading: "Free resources", items: [] },
  },
  testimonials: {
    type: "testimonials",
    label: "Testimonials",
    description: "Student quotes with photo + university",
    defaultData: { heading: "What students say", items: [] },
  },
  stats: {
    type: "stats",
    label: "Stats",
    description: "Big-number stats row",
    defaultData: { heading: "By the numbers", items: [] },
  },
  faq: {
    type: "faq",
    label: "FAQ",
    description: "Collapsible question-and-answer list",
    defaultData: { heading: "Frequently asked", items: [] },
  },
  leadForm: {
    type: "leadForm",
    label: "Lead form",
    description: "Embedded lead-capture form (by key)",
    defaultData: { formKey: "free-counseling" },
  },
};

// Order in the "Add section" menu — groups them by typical homepage flow:
//   above-fold → trust/eligibility → discovery → social proof → conversion.
export const BLOCK_TYPES: SectionType[] = [
  "hero",
  "stats",
  "eligibility",
  "countryGrid",
  "coursePathways",
  "visaRisk",
  "resources",
  "testimonials",
  "faq",
  "richText",
  "cta",
  "leadForm",
];
