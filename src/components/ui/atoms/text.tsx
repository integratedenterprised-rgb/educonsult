import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Text — body copy atom. Pairs with `Heading` to form the typography system.
 *
 * Defaults to a `<p>` with `text-base/text-foreground`. Use `as="span"` (or
 * `asChild`) when you need inline text in a heading or button.
 */
const textVariants = cva("text-foreground", {
  variants: {
    size: {
      xs: "text-xs leading-4",
      sm: "text-sm leading-5",
      base: "text-base leading-6",
      lg: "text-lg leading-7",
      xl: "text-xl leading-7",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      danger: "text-destructive",
      success: "text-emerald-600 dark:text-emerald-400",
    },
    align: { left: "text-left", center: "text-center", right: "text-right" },
    truncate: { true: "truncate" },
  },
  defaultVariants: { size: "base", weight: "normal", tone: "default", align: "left" },
});

type TextElement = "p" | "span" | "div" | "label";

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: TextElement;
  asChild?: boolean;
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as = "p", asChild = false, size, weight, tone, align, truncate, className, ...rest }, ref) => {
    const Tag = asChild ? Slot : (as as "p");
    return (
      <Tag
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn(textVariants({ size, weight, tone, align, truncate, className }))}
        {...rest}
      />
    );
  },
);
Text.displayName = "Text";

export { textVariants };
