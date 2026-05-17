import type { StatsSection } from "@/types/cms";
import { Container } from "@/components/layout/container";

export function StatsBlock({ section }: { section: StatsSection }) {
  return (
    <Container>
      {section.data.heading ? (
        <h2 className="mb-8 font-heading text-3xl font-semibold tracking-tight">{section.data.heading}</h2>
      ) : null}
      <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {section.data.items.map((s, i) => (
          <div key={i} className="text-center">
            <dt className="font-heading text-4xl font-semibold text-primary md:text-5xl">{s.value}</dt>
            <dd className="mt-2 text-sm text-muted-foreground">{s.label}</dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}
