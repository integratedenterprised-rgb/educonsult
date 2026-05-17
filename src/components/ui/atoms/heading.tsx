import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Heading — semantic heading atom with decoupled visual size.
 *
 * `level` controls the rendered tag (h1–h6); `size` controls the visual scale.
 * This lets a page have one visual hero headline that is still rendered as
 * `<h1>` for accessibility and SEO, even if the type ramp puts it at "4xl".
 */
const headingVariants = cva("font-heading text-foreground tracking-tight", {
  variants: {
    size: {
      "6xl": "text-5xl font-semibold leading-[1.05] md:text-6xl",
      "5xl": "text-4xl font-semibold leading-[1.05] md:text-5xl",
      "4xl": "text-3xl font-semibold leading-tight md:text-4xl",
      "3xl": "text-2xl font-semibold leading-tight md:text-3xl",
      "2xl": "text-xl font-semibold leading-snug md:text-2xl",
      xl: "text-lg font-semibold leading-snug md:text-xl",
      lg: "text-base font-semibold leading-snug",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: { left: "text-left", center: "text-center", right: "text-right" },
  },
  defaultVariants: { size: "3xl", weight: "semibold", align: "left" },
});

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
    VariantProps<typeof headingVariants> {
  level?: HeadingLevel;
  asChild?: boolean;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, size, weight, align, asChild = false, className, ...rest }, ref) => {
    const Tag = asChild ? Slot : (`h${level}` as `h${HeadingLevel}`);
    return (
      <Tag
        ref={ref as React.Ref<HTMLHeadingElement>}
        className={cn(headingVariants({ size, weight, align, className }))}
        {...rest}
      />
    );
  },
);
Heading.displayName = "Heading";

export { headingVariants };
