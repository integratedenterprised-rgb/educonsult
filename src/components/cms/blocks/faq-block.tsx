import type { FaqSection } from "@/types/cms";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd } from "@/lib/seo";

/**
 * FAQ block — collapsible Q&A list. Auto-emits FAQPage JSON-LD when at least
 * one item is present so Google can claim FAQ rich results.
 */
export function FaqBlock({ section }: { section: FaqSection }) {
  const items = section.data.items;
  return (
    <Container>
      {items.length > 0 ? <JsonLd data={faqJsonLd(items)} /> : null}
      {section.data.heading ? (
        <h2 className="mb-8 font-heading text-3xl font-semibold tracking-tight">{section.data.heading}</h2>
      ) : null}
      <div className="max-w-3xl space-y-4">
        {items.map((f, i) => (
          <details key={i} className="group rounded-lg border border-border bg-card p-5">
            <summary className="cursor-pointer list-none font-medium text-card-foreground">
              {f.q}
              <span className="float-right text-muted-foreground transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </Container>
  );
}
