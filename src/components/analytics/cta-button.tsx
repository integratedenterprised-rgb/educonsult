"use client";

/**
 * Drop-in CTA wrapper that emits a `CTA_CLICK` event.
 *
 * Use this for any "convertable" link/button on a public page. The CTA id is
 * the dimension every CTA dashboard groups by — keep it stable across copy
 * changes (e.g. "hero-book-call" not "Book your free call").
 *
 * For non-link CTAs (a `<button>` that opens a modal), set `href` to `null`
 * and pass `onClick` as usual. We still track the click.
 */
import * as React from "react";
import Link from "next/link";
import { trackCtaClick } from "@/lib/analytics/client";

interface CtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ctaId: string;
  ctaLabel?: string;
  href?: string | null;
  external?: boolean;
  children: React.ReactNode;
}

export function CtaButton({
  ctaId,
  ctaLabel,
  href,
  external,
  onClick,
  children,
  ...rest
}: CtaButtonProps) {
  const label = ctaLabel ?? (typeof children === "string" ? children : ctaId);
  const handle = (e: React.MouseEvent<HTMLElement>) => {
    trackCtaClick({ ctaId, ctaLabel: label, ctaHref: href ?? undefined });
    onClick?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handle}
        {...(rest as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link
        href={href}
        onClick={handle}
        {...(rest as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={handle} {...rest}>
      {children}
    </button>
  );
}
