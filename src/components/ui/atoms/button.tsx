import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/**
 * Button — primary interactive atom.
 *
 * Variants follow the design-system spec: primary | secondary | ghost | danger
 * | outline | link. `loading` enables a leading spinner and disables interaction
 * without changing the layout (so a button doesn't reflow when entering loading).
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        danger:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9 px-4 py-2",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

// Aliases for legacy callers using the original shadcn variant names.
type LegacyVariant = "default" | "destructive";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
    Omit<VariantProps<typeof buttonVariants>, "variant"> {
  asChild?: boolean;
  loading?: boolean;
  disabled?: boolean;
  variant?: NonNullable<VariantProps<typeof buttonVariants>["variant"]> | LegacyVariant;
}

const LEGACY_VARIANT_MAP: Record<LegacyVariant, NonNullable<VariantProps<typeof buttonVariants>["variant"]>> = {
  default: "primary",
  destructive: "danger",
};

function resolveVariant(v: ButtonProps["variant"]): NonNullable<VariantProps<typeof buttonVariants>["variant"]> {
  if (!v) return "primary";
  if (v in LEGACY_VARIANT_MAP) return LEGACY_VARIANT_MAP[v as LegacyVariant];
  return v as NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    const resolvedVariant = resolveVariant(variant);

    return (
      <Comp
        className={cn(buttonVariants({ variant: resolvedVariant, size, fullWidth, className }))}
        ref={ref}
        aria-busy={loading || undefined}
        disabled={isDisabled}
        {...props}
      >
        {loading ? <Spinner size={size === "sm" ? "xs" : "sm"} label="Submitting" /> : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
