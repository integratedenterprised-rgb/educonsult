/**
 * Post-level FAQ block.
 *
 * Server-rendered (collapsible details). Emits FAQPage JSON-LD so Google
 * can claim FAQ rich results — pair with the article schema in
 * `blog-json-ld.tsx`.
 */
import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd } from "@/lib/seo";

export interface PostFaqItem {
  question: string;
  answer: string;
}

export function PostFaq({ items, heading = "Frequently asked questions" }: {
  items: PostFaqItem[];
  heading?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-12 border-t border-border pt-10" aria-labelledby="post-faq-heading">
      <JsonLd data={faqJsonLd(items.map((i) => ({ q: i.question, a: i.answer })))} />
      <h2 id="post-faq-heading" className="font-heading text-2xl font-semibold tracking-tight">
        {heading}
      </h2>
      <div className="mt-6 space-y-3">
        {items.map((f, i) => (
          <details key={i} className="group rounded-lg border border-border bg-card p-5">
            <summary className="cursor-pointer list-none font-medium text-card-foreground">
              {f.question}
              <span className="float-right text-muted-foreground transition group-open:rotate-45">+</span>
            </summary>
            <div className="mt-3 whitespace-pre-line text-muted-foreground">{f.answer}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
