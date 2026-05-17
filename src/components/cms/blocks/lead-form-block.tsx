import type { LeadFormSection } from "@/types/cms";
import { Container } from "@/components/layout/container";

/**
 * Lead-form block is a stub for now. When the LeadForm CMS model lands, this
 * component will fetch the form definition by `formKey` and render the dynamic
 * RHF + Zod form. Keep the visual placeholder so admins can preview layout.
 */
export function LeadFormBlock({ section }: { section: LeadFormSection }) {
  return (
    <Container>
      <div className="mx-auto max-w-xl rounded-xl border border-dashed border-border bg-card p-8 text-center">
        {section.data.heading ? (
          <h2 className="font-heading text-2xl font-semibold">{section.data.heading}</h2>
        ) : null}
        {section.data.subheading ? (
          <p className="mt-2 text-muted-foreground">{section.data.subheading}</p>
        ) : null}
        <p className="mt-6 text-sm text-muted-foreground">
          Form &ldquo;{section.data.formKey}&rdquo; — renderer pending.
        </p>
      </div>
    </Container>
  );
}
