import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { SectionSettings } from "@/types/cms";

/**
 * SectionWrapper — vertical-rhythm + background container for CMS blocks.
 *
 * CMS-driven path: callers pass `settings` (the JSON blob stored on the
 * section row) and the wrapper derives variants from it.
 *
 * Design-system path: callers can pass `paddingY` / `background` directly
 * — useful in admin previews and one-off marketing pages.
 */
const sectionVariants = cva("", {
  variants: {
    paddingY: {
      none: "py-0",
      sm: "py-8",
      md: "py-12 md:py-16",
      lg: "py-16 md:py-24",
      xl: "py-24 md:py-32",
    },
    background: {
      default: "bg-background text-foreground",
      muted: "bg-muted text-foreground",
      primary: "bg-primary text-primary-foreground",
      card: "bg-card text-card-foreground",
    },
  },
  defaultVariants: { paddingY: "md", background: "default" },
});

export interface SectionWrapperProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "id">,
    VariantProps<typeof sectionVariants> {
  settings?: SectionSettings;
  anchor?: string;
  children: React.ReactNode;
}

export function SectionWrapper({
  settings,
  anchor,
  paddingY,
  background,
  className,
  children,
  ...rest
}: SectionWrapperProps) {
  const py = paddingY ?? settings?.paddingY;
  const bg = background ?? settings?.background;
  return (
    <section
      id={anchor}
      className={cn(sectionVariants({ paddingY: py, background: bg }), className)}
      {...rest}
    >
      {children}
    </section>
  );
}

export { sectionVariants };
