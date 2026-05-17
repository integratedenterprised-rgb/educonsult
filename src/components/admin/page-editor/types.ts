/**
 * Form-state shape for the page editor.
 *
 * `sections[i].data` is intentionally typed as `any` here. The Section union
 * in `@/types/cms` has variant-specific `data` shapes, which would force
 * `react-hook-form`'s path inference to dead-end on `sections.0.data.items`
 * (only valid for some variants). Zod (`pageUpdateSchema` via
 * `zodResolver`) re-checks the concrete shape at submit time, so end-to-end
 * type safety is preserved at the API boundary.
 */
import type { ContentStatus } from "@prisma/client";
import type { SectionSettings, SectionType } from "@/types/cms";

export interface PageFormSection {
  id: string;
  type: SectionType;
  order: number;
  isVisible?: boolean;
  anchor?: string;
  settings?: SectionSettings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface PageFormValues {
  title: string;
  slug: string;
  status: ContentStatus;
  template: string | null;
  isHomepage: boolean;

  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImageUrl: string;

  sections: PageFormSection[];
}
