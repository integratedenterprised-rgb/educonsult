import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckSquare,
  Download,
  FileText,
  Link2,
  Video,
} from "lucide-react";
import type { ResourcesSection } from "@/types/cms";
import { Container } from "@/components/layout/container";
import { Heading, Text, Badge } from "@/components/ui";

const TYPE_META: Record<
  ResourcesSection["data"]["items"][number]["type"],
  { Icon: ComponentType<{ className?: string }>; label: string }
> = {
  PDF: { Icon: Download, label: "PDF" },
  VIDEO: { Icon: Video, label: "Video" },
  ARTICLE: { Icon: FileText, label: "Article" },
  CHECKLIST: { Icon: CheckSquare, label: "Checklist" },
  TEMPLATE: { Icon: BookOpen, label: "Template" },
  EXTERNAL_LINK: { Icon: Link2, label: "External" },
};

export function ResourcesBlock({ section }: { section: ResourcesSection }) {
  const { heading, items } = section.data;
  return (
    <Container>
      {heading ? (
        <div className="mb-8 flex items-end justify-between">
          <Heading level={2} size="3xl">
            {heading}
          </Heading>
        </div>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r, i) => {
          const meta = TYPE_META[r.type];
          const Icon = meta.Icon;
          const external = r.type === "EXTERNAL_LINK" || /^https?:\/\//i.test(r.href);
          return (
            <li key={i}>
              <Link
                href={r.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="group flex h-full flex-col rounded-xl border border-border bg-card transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {r.thumbnailUrl ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-xl">
                    <Image
                      src={r.thumbnailUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center rounded-t-xl bg-muted">
                    <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <Badge variant="secondary" className="self-start">
                    <Icon className="h-3 w-3" aria-hidden />
                    {meta.label}
                  </Badge>
                  <Text weight="semibold" className="mt-3">
                    {r.title}
                  </Text>
                  {r.description ? (
                    <Text size="sm" tone="muted" className="mt-1">
                      {r.description}
                    </Text>
                  ) : null}
                  <Text
                    size="sm"
                    tone="primary"
                    className="mt-auto flex items-center gap-1 pt-4 transition-transform group-hover:translate-x-0.5"
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Text>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
