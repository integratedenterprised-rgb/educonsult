import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { EligibilitySection } from "@/types/cms";
import { Container } from "@/components/layout/container";
import { Heading, Text, Button } from "@/components/ui";

/**
 * Eligibility — checklist of criteria a prospective student should meet,
 * plus an optional CTA to the eligibility checker. Pure presentational;
 * any interactive checker lives in a separate route.
 */
export function EligibilityBlock({ section }: { section: EligibilitySection }) {
  const { heading, subheading, criteria, ctaLabel, ctaUrl } = section.data;
  return (
    <Container>
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          {heading ? (
            <Heading level={2} size="3xl">
              {heading}
            </Heading>
          ) : null}
          {subheading ? (
            <Text tone="muted" className="mt-3">
              {subheading}
            </Text>
          ) : null}
          {ctaLabel && ctaUrl ? (
            <Button asChild className="mt-6">
              <Link href={ctaUrl}>{ctaLabel}</Link>
            </Button>
          ) : null}
        </div>

        <ul className="space-y-4">
          {criteria.map((c, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <Text weight="semibold">{c.label}</Text>
                {c.description ? (
                  <Text size="sm" tone="muted" className="mt-1">
                    {c.description}
                  </Text>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
