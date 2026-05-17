"use client";

import type { SectionType } from "@/types/cms";
import { HeroForm } from "./forms/hero-form";
import { RichTextForm } from "./forms/rich-text-form";
import { CtaForm } from "./forms/cta-form";
import { CountryGridForm } from "./forms/country-grid-form";
import { EligibilityForm } from "./forms/eligibility-form";
import { VisaRiskForm } from "./forms/visa-risk-form";
import { CoursePathwaysForm } from "./forms/course-pathways-form";
import { ResourcesForm } from "./forms/resources-form";
import { TestimonialsForm } from "./forms/testimonials-form";
import { StatsForm } from "./forms/stats-form";
import { FaqForm } from "./forms/faq-form";
import { LeadFormForm } from "./forms/lead-form-form";

const FORMS: Record<SectionType, React.ComponentType<{ index: number }>> = {
  hero: HeroForm,
  richText: RichTextForm,
  cta: CtaForm,
  countryGrid: CountryGridForm,
  eligibility: EligibilityForm,
  visaRisk: VisaRiskForm,
  coursePathways: CoursePathwaysForm,
  resources: ResourcesForm,
  testimonials: TestimonialsForm,
  stats: StatsForm,
  faq: FaqForm,
  leadForm: LeadFormForm,
};

export function SectionFormRouter({ type, index }: { type: SectionType; index: number }) {
  const Form = FORMS[type];
  return <Form index={index} />;
}
