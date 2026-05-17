import Image from "next/image";
import type { TestimonialsSection } from "@/types/cms";
import { Container } from "@/components/layout/container";

export function TestimonialsBlock({ section }: { section: TestimonialsSection }) {
  return (
    <Container>
      {section.data.heading ? (
        <h2 className="mb-8 font-heading text-3xl font-semibold tracking-tight">{section.data.heading}</h2>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {section.data.items.map((t, i) => (
          <figure key={i} className="rounded-xl border border-border bg-card p-6">
            <blockquote className="text-card-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              {t.photoUrl ? (
                <Image
                  src={t.photoUrl}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  className="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted" />
              )}
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                {t.title ? <div className="text-xs text-muted-foreground">{t.title}</div> : null}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Container>
  );
}
