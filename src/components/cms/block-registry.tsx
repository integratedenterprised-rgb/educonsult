/**
 * Section block registry.
 *
 * The CMS stores each page as an ordered list of typed `Section` objects.
 * `SectionRenderer` looks up the matching component in this registry and
 * hands it the section's typed `data`. Adding a new block type means:
 *
 *  1) Extend `Section` in `@/types/cms`.
 *  2) Add a renderer component under `@/components/cms/blocks/`.
 *  3) Register it here.
 *
 * Above-the-fold blocks (hero, rich-text, cta, country-grid) import eagerly so
 * they're part of the initial render. Below-the-fold blocks use `next/dynamic`
 * so their JS / RSC chunks land lazily — the section-renderer wraps each block
 * in a Suspense boundary, so streaming kicks in naturally.
 */
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Section } from "@/types/cms";
import { HeroBlock } from "./blocks/hero-block";
import { RichTextBlock } from "./blocks/rich-text-block";
import { CtaBlock } from "./blocks/cta-block";
import { CountryGridBlock } from "./blocks/country-grid-block";

const EligibilityBlock = dynamic(() =>
  import("./blocks/eligibility-block").then((m) => m.EligibilityBlock),
);
const VisaRiskBlock = dynamic(() =>
  import("./blocks/visa-risk-block").then((m) => m.VisaRiskBlock),
);
const CoursePathwaysBlock = dynamic(() =>
  import("./blocks/course-pathways-block").then((m) => m.CoursePathwaysBlock),
);
const ResourcesBlock = dynamic(() =>
  import("./blocks/resources-block").then((m) => m.ResourcesBlock),
);
const TestimonialsBlock = dynamic(() =>
  import("./blocks/testimonials-block").then((m) => m.TestimonialsBlock),
);
const StatsBlock = dynamic(() => import("./blocks/stats-block").then((m) => m.StatsBlock));
const FaqBlock = dynamic(() => import("./blocks/faq-block").then((m) => m.FaqBlock));
const LeadFormBlock = dynamic(() =>
  import("./blocks/lead-form-block").then((m) => m.LeadFormBlock),
);

type BlockComponent<T extends Section> = ComponentType<{ section: T }>;

// Mapped type forces exhaustiveness: every variant of `Section` must register
// a renderer or TypeScript fails the build.
type BlockRegistry = {
  [T in Section as T["type"]]: BlockComponent<T>;
};

export const blockRegistry: BlockRegistry = {
  hero: HeroBlock,
  richText: RichTextBlock,
  cta: CtaBlock,
  countryGrid: CountryGridBlock,
  eligibility: EligibilityBlock,
  visaRisk: VisaRiskBlock,
  coursePathways: CoursePathwaysBlock,
  resources: ResourcesBlock,
  testimonials: TestimonialsBlock,
  stats: StatsBlock,
  faq: FaqBlock,
  leadForm: LeadFormBlock,
};
