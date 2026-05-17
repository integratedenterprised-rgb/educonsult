import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        ghost: "border-transparent text-muted-foreground",
        danger: "border-transparent bg-destructive/10 text-destructive",
        success: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        warning: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
