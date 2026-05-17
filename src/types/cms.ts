/**
 * CMS types — shared across server services, API responses, and renderers.
 *
 * `Section` is a discriminated union keyed by `type`. Adding a new block:
 *  1) Add a member to this union.
 *  2) Register a renderer in `src/components/cms/block-registry.ts`.
 *  3) Add an admin form to author the block.
 *
 * No other code changes required to render the new section type.
 */

export type SectionType =
  | "hero"
  | "richText"
  | "cta"
  | "countryGrid"
  | "eligibility"
  | "visaRisk"
  | "coursePathways"
  | "resources"
  | "testimonials"
  | "stats"
  | "faq"
  | "leadForm";

export interface BaseSection {
  id: string;
  type: SectionType;
  order: number;
  isVisible?: boolean;
  anchor?: string;
  settings?: SectionSettings;
}

export interface SectionSettings {
  paddingY?: "none" | "sm" | "md" | "lg" | "xl";
  background?: "default" | "muted" | "primary" | "card";
  containerWidth?: "narrow" | "default" | "wide" | "full";
}

export interface HeroSection extends BaseSection {
  type: "hero";
  data: {
    eyebrow?: string;
    headline: string;
    subheadline?: string;
    backgroundImage?: string;
    primaryCta?: { label: string; url: string };
    secondaryCta?: { label: string; url: string };
  };
}

export interface RichTextSection extends BaseSection {
  type: "richText";
  data: { html: string };
}

export interface CtaSection extends BaseSection {
  type: "cta";
  data: {
    heading: string;
    body?: string;
    primaryCta?: { label: string; url: string };
    secondaryCta?: { label: string; url: string };
  };
}

export interface CountryGridSection extends BaseSection {
  type: "countryGrid";
  data: {
    heading?: string;
    countries: Array<{ name: string; flagUrl?: string; href: string }>;
  };
}

export interface TestimonialsSection extends BaseSection {
  type: "testimonials";
  data: {
    heading?: string;
    items: Array<{ name: string; quote: string; title?: string; photoUrl?: string }>;
  };
}

export interface StatsSection extends BaseSection {
  type: "stats";
  data: {
    heading?: string;
    items: Array<{ value: string; label: string }>;
  };
}

export interface FaqSection extends BaseSection {
  type: "faq";
  data: {
    heading?: string;
    items: Array<{ q: string; a: string }>;
  };
}

export interface LeadFormSection extends BaseSection {
  type: "leadForm";
  data: { formKey: string; heading?: string; subheading?: string };
}

export interface EligibilitySection extends BaseSection {
  type: "eligibility";
  data: {
    heading?: string;
    subheading?: string;
    criteria: Array<{
      label: string;
      description?: string;
      iconKey?: string;
    }>;
    ctaLabel?: string;
    ctaUrl?: string;
  };
}

export interface VisaRiskSection extends BaseSection {
  type: "visaRisk";
  data: {
    heading?: string;
    subheading?: string;
    factors: Array<{
      label: string;
      description?: string;
      severity: "low" | "medium" | "high";
    }>;
    ctaLabel?: string;
    ctaUrl?: string;
  };
}

export interface CoursePathwaysSection extends BaseSection {
  type: "coursePathways";
  data: {
    heading?: string;
    subheading?: string;
    pathways: Array<{
      title: string;
      level: string;
      field: string;
      countryName?: string;
      durationMonths?: number;
      avgTuitionUsd?: number;
      href: string;
    }>;
  };
}

export interface ResourcesSection extends BaseSection {
  type: "resources";
  data: {
    heading?: string;
    items: Array<{
      title: string;
      description?: string;
      type: "PDF" | "VIDEO" | "ARTICLE" | "CHECKLIST" | "TEMPLATE" | "EXTERNAL_LINK";
      href: string;
      thumbnailUrl?: string;
    }>;
  };
}

export type Section =
  | HeroSection
  | RichTextSection
  | CtaSection
  | CountryGridSection
  | EligibilitySection
  | VisaRiskSection
  | CoursePathwaysSection
  | ResourcesSection
  | TestimonialsSection
  | StatsSection
  | FaqSection
  | LeadFormSection;

// -----------------------------------------------------------------------------
//  Page / nav / footer shapes returned by services
// -----------------------------------------------------------------------------

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  isHomepage: boolean;
  template: string | null;
  sections: Section[];
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
    ogImageUrl: string | null;
  };
}

export interface NavLink {
  id: string;
  label: string;
  url: string;
  iconKey?: string | null;
  openInNew: boolean;
  children: NavLink[];
}

export interface FooterColumnDto {
  id: string;
  heading: string;
  order: number;
  links: Array<{ id: string; label: string; url: string; openInNew: boolean }>;
}

export interface SiteSettingsDto {
  name: string;
  tagline: string;
  logoUrl: string;
  contact: { email: string; phone: string; address: string };
  social: { facebook: string; instagram: string; linkedin: string };
}
