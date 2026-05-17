import type { RichTextSection } from "@/types/cms";
import { Container } from "@/components/layout/container";
import { autoInternalLink, DEFAULT_LINK_RULES } from "@/lib/seo";

/**
 * Rich-text block.
 *
 * Server-renders CMS-authored HTML. Before render, the body is passed through
 * `autoInternalLink` so domain terms like "student visa" or "IELTS" become
 * internal links to their topic pages without admins manually adding `<a>`
 * tags. Links inside existing anchors / code / pre tags are preserved.
 */
export function RichTextBlock({ section }: { section: RichTextSection }) {
  const linkedHtml = autoInternalLink(section.data.html, DEFAULT_LINK_RULES);
  return (
    <Container>
      <div
        className="prose prose-neutral max-w-3xl dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: linkedHtml }}
      />
    </Container>
  );
}
