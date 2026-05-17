import Link from "next/link";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { VisaRiskSection } from "@/types/cms";
import { Container } from "@/components/layout/container";
import { Heading, Text, Badge, Button } from "@/components/ui";

const SEVERITY_META = {
  low: { Icon: ShieldCheck, badge: "success" as const, label: "Low risk" },
  medium: { Icon: AlertTriangle, badge: "warning" as const, label: "Medium risk" },
  high: { Icon: ShieldAlert, badge: "danger" as const, label: "High risk" },
};

/**
 * VisaRisk — surfaces the factors evaluated by the visa-risk engine so
 * applicants understand what's being scored. Severity color comes from the
 * design-system Badge tones, not hardcoded hex.
 */
export function VisaRiskBlock({ section }: { section: VisaRiskSection }) {
  const { heading, subheading, factors, ctaLabel, ctaUrl } = section.data;
  return (
    <Container>
      <div className="mx-auto max-w-3xl text-center">
        {heading ? (
          <Heading level={2} size="3xl" align="center">
            {heading}
          </Heading>
        ) : null}
        {subheading ? (
          <Text tone="muted" align="center" className="mt-3">
            {subheading}
          </Text>
        ) : null}
      </div>

      <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {factors.map((f, i) => {
          const meta = SEVERITY_META[f.severity];
          const Icon = meta.Icon;
          return (
            <li key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                <Badge variant={meta.badge}>{meta.label}</Badge>
              </div>
              <Text weight="semibold" className="mt-4">
                {f.label}
              </Text>
              {f.description ? (
                <Text size="sm" tone="muted" className="mt-1">
                  {f.description}
                </Text>
              ) : null}
            </li>
          );
        })}
      </ul>

      {ctaLabel && ctaUrl ? (
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href={ctaUrl}>{ctaLabel}</Link>
          </Button>
        </div>
      ) : null}
    </Container>
  );
}
