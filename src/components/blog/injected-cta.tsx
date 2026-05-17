/**
 * Server-side renderer for `BlogPostCta` rows.
 *
 * The render pipeline (lib/blog/render.ts) needs a CTA *as HTML* so it can
 * splice fragments into the body. We render the CTA element to a markup
 * string at the call site by passing the React tree through React's static
 * markup — but to keep the bundle small and avoid pulling react-dom/server
 * into the render path, we ship a tiny HTML serializer here.
 *
 * Trade-off: this loses React component composition for CTAs, but it keeps
 * the post body composable as a single sanitized HTML string, which is the
 * cheaper rendering model. End-of-post and sidebar CTAs (which render
 * outside the body) use the proper React component instead.
 */
import type { BlogCtaPlacement, BlogCtaVariant } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/atoms/button";

export interface InjectedCtaData {
  id: string;
  placement: BlogCtaPlacement;
  variant: BlogCtaVariant;
  heading: string;
  body: string | null;
  primaryLabel: string | null;
  primaryUrl: string | null;
  secondaryLabel: string | null;
  secondaryUrl: string | null;
  backgroundImage: string | null;
  formKey: string | null;
}

/** React element — used for SIDEBAR / END_OF_POST CTAs. */
export function InjectedCta({ data }: { data: InjectedCtaData }) {
  const wrapClass =
    data.variant === "BANNER"
      ? "rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8"
      : data.variant === "INLINE"
        ? "rounded-md border-l-4 border-primary bg-muted/40 p-4"
        : "rounded-xl border border-border bg-card p-6 shadow-sm";

  return (
    <aside className={`not-prose my-8 ${wrapClass}`} aria-label="Call to action">
      <h3 className="font-heading text-lg font-semibold">{data.heading}</h3>
      {data.body ? <p className="mt-2 text-sm text-muted-foreground">{data.body}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {data.primaryLabel && data.primaryUrl ? (
          <Button asChild size="sm">
            <Link href={data.primaryUrl}>{data.primaryLabel}</Link>
          </Button>
        ) : null}
        {data.secondaryLabel && data.secondaryUrl ? (
          <Button asChild size="sm" variant="outline">
            <Link href={data.secondaryUrl}>{data.secondaryLabel}</Link>
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

/**
 * Serialize a CTA to an HTML string so it can be spliced into the body.
 * Used by the render pipeline for AFTER_INTRO / AFTER_HEADING / AFTER_PARAGRAPH
 * placements. Kept in sync with `<InjectedCta />` so visual parity is preserved.
 */
export function injectedCtaToHtml(data: InjectedCtaData): string {
  const wrapClass =
    data.variant === "BANNER"
      ? "rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8"
      : data.variant === "INLINE"
        ? "rounded-md border-l-4 border-primary bg-muted/40 p-4"
        : "rounded-xl border border-border bg-card p-6 shadow-sm";

  const primary =
    data.primaryLabel && data.primaryUrl
      ? `<a class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" href="${escapeAttr(data.primaryUrl)}">${escapeText(data.primaryLabel)}</a>`
      : "";
  const secondary =
    data.secondaryLabel && data.secondaryUrl
      ? `<a class="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted" href="${escapeAttr(data.secondaryUrl)}">${escapeText(data.secondaryLabel)}</a>`
      : "";
  const body = data.body
    ? `<p class="mt-2 text-sm text-muted-foreground">${escapeText(data.body)}</p>`
    : "";
  return `<aside class="not-prose my-8 ${wrapClass}" aria-label="Call to action">` +
    `<h3 class="font-heading text-lg font-semibold">${escapeText(data.heading)}</h3>` +
    body +
    `<div class="mt-4 flex flex-wrap gap-2">${primary}${secondary}</div>` +
    `</aside>`;
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
