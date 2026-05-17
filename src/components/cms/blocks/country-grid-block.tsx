import Link from "next/link";
import Image from "next/image";
import type { CountryGridSection } from "@/types/cms";
import { Container } from "@/components/layout/container";

export function CountryGridBlock({ section }: { section: CountryGridSection }) {
  return (
    <Container>
      {section.data.heading ? (
        <h2 className="mb-8 font-heading text-3xl font-semibold tracking-tight">{section.data.heading}</h2>
      ) : null}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {section.data.countries.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="group flex flex-col items-center rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:shadow-sm"
            >
              {c.flagUrl ? (
                <Image
                  src={c.flagUrl}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  className="mb-2 h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="mb-2 h-10 w-10 rounded-full bg-muted" />
              )}
              <span className="text-sm font-medium text-card-foreground">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
