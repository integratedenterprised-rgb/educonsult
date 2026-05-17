import Link from "next/link";
import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import type { CoursePathwaysSection } from "@/types/cms";
import { Container } from "@/components/layout/container";
import { Heading, Text, Badge } from "@/components/ui";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * CoursePathways — destination/level/field cards. The on-page list is
 * curated per section (each item is just a card with a `href` to the
 * pathway detail page), so renders without needing to query DB pathways
 * here. The detail page does the deeper Country / requirements lookup.
 */
export function CoursePathwaysBlock({ section }: { section: CoursePathwaysSection }) {
  const { heading, subheading, pathways } = section.data;
  return (
    <Container>
      {heading ? (
        <Heading level={2} size="3xl">
          {heading}
        </Heading>
      ) : null}
      {subheading ? (
        <Text tone="muted" className="mt-2 max-w-2xl">
          {subheading}
        </Text>
      ) : null}

      <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pathways.map((p, i) => (
          <li key={i}>
            <Link
              href={p.href}
              className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant="primary">{p.level}</Badge>
                <Text size="xs" tone="muted">
                  {p.field}
                </Text>
              </div>
              <Text weight="semibold" className="mt-3 flex items-start justify-between gap-2">
                <span>{p.title}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Text>
              <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
                {p.countryName ? (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    <dd>{p.countryName}</dd>
                  </div>
                ) : null}
                {p.durationMonths ? (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    <dd>{p.durationMonths} mo</dd>
                  </div>
                ) : null}
                {p.avgTuitionUsd ? <dd>{usdFormatter.format(p.avgTuitionUsd)} / yr</dd> : null}
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
