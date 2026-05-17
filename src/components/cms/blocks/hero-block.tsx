import Link from "next/link";
import Image from "next/image";
import type { HeroSection } from "@/types/cms";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/atoms/button";

/**
 * Hero is the LCP element on most landing pages. The background image is
 * rendered through `next/image` with `priority` so it joins the preload list
 * and skips lazy-loading. We layer the dark overlay as a sibling element (not
 * a CSS gradient on a background-image URL) so the browser can hand the image
 * decode to the GPU.
 */
export function HeroBlock({ section }: { section: HeroSection }) {
  const { eyebrow, headline, subheadline, primaryCta, secondaryCta, backgroundImage } = section.data;
  return (
    <div className="relative isolate overflow-hidden">
      {backgroundImage ? (
        <>
          <Image
            src={backgroundImage}
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="-z-10 object-cover"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-black/40" />
        </>
      ) : null}
      <Container className="py-20 md:py-28">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-6xl">{headline}</h1>
          {subheadline ? (
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">{subheadline}</p>
          ) : null}
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCta ? (
                <Button asChild size="lg">
                  <Link href={primaryCta.url}>{primaryCta.label}</Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={secondaryCta.url}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
