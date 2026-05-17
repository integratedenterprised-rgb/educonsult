import { Suspense } from "react";
import type { Section } from "@/types/cms";
import { blockRegistry } from "./block-registry";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { cn } from "@/lib/utils";

interface SectionRendererProps {
  sections: Section[];
}

/**
 * Renders an ordered list of CMS sections.
 *
 * Perf-shaping rules applied here so individual blocks don't have to think
 * about it:
 *   - The first section (typically the hero / LCP) renders eagerly.
 *   - Subsequent sections render inside a Suspense boundary so dynamic-imported
 *     blocks stream in without blocking the document.
 *   - `content-visibility: auto` (.cv-auto) lets the browser skip layout/paint
 *     for sections that scroll off-screen, which improves rendering on long
 *     CMS pages without changing semantics.
 */
export function SectionRenderer({ sections }: SectionRendererProps) {
  if (!sections.length) return null;
  return (
    <>
      {sections.map((section, index) => {
        // Index signature on a mapped union — cast is safe because the runtime
        // value of `type` selects the correct entry by construction.
        const Block = blockRegistry[section.type] as React.ComponentType<{ section: Section }>;
        if (!Block) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[cms] No block registered for type "${section.type}"`);
          }
          return null;
        }
        const isLcp = index === 0;
        const wrapper = (
          <SectionWrapper
            key={section.id}
            settings={section.settings}
            anchor={section.anchor}
            className={cn(!isLcp && "cv-auto")}
          >
            <Block section={section} />
          </SectionWrapper>
        );
        if (isLcp) return wrapper;
        return (
          <Suspense key={section.id} fallback={null}>
            {wrapper}
          </Suspense>
        );
      })}
    </>
  );
}
