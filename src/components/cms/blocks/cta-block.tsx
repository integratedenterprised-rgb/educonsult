import Link from "next/link";
import type { CtaSection } from "@/types/cms";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/atoms/button";

export function CtaBlock({ section }: { section: CtaSection }) {
  const { heading, body, primaryCta, secondaryCta } = section.data;
  return (
    <Container>
      <div className="rounded-2xl bg-primary px-8 py-12 text-primary-foreground md:px-12 md:py-16">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-semibold md:text-3xl">{heading}</h2>
            {body ? <p className="mt-2 text-primary-foreground/80">{body}</p> : null}
          </div>
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap gap-3">
              {primaryCta ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href={primaryCta.url}>{primaryCta.label}</Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link href={secondaryCta.url}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
