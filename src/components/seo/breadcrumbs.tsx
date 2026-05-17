import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { JsonLd } from "./json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { Container } from "@/components/layout/container";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * Breadcrumbs — visual trail + paired JSON-LD `BreadcrumbList` schema.
 *
 * The crumbs array should include "Home" as the first entry. The current
 * page is rendered as plain text (no link); everything before it is linked.
 */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <Container className={className}>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="h-3 w-3" aria-hidden /> : null}
                {isLast ? (
                  <span aria-current="page" className="text-foreground">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className="transition hover:text-foreground">
                    {i === 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Home className="h-3 w-3" aria-hidden />
                        <span>{item.name}</span>
                      </span>
                    ) : (
                      item.name
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </Container>
  );
}

/**
 * Build breadcrumbs from a slug path. Each segment becomes one crumb; the
 * label is the segment titlecased. Pass `pageTitle` to override the leaf label.
 */
export function breadcrumbsFromSlugPath(
  slugSegments: string[],
  pageTitle?: string,
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ name: "Home", path: "/" }];
  let acc = "";
  for (let i = 0; i < slugSegments.length; i++) {
    const seg = slugSegments[i]!;
    acc += `/${seg}`;
    const isLast = i === slugSegments.length - 1;
    crumbs.push({
      name: isLast && pageTitle ? pageTitle : titleCase(seg),
      path: acc,
    });
  }
  return crumbs;
}

function titleCase(slugSegment: string): string {
  return slugSegment
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
