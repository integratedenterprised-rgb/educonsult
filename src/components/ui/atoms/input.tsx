import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border bg-background shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-xs",
        md: "h-9 px-3 py-1 text-sm",
        lg: "h-11 px-4 text-base",
      },
      state: {
        default: "border-input focus-visible:ring-ring",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-emerald-500 focus-visible:ring-emerald-500",
      },
    },
    defaultVariants: { size: "md", state: "default" },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, state, "aria-invalid": ariaInvalid, ...props }, ref) => {
    // Promote an explicit `aria-invalid` to the error visual state so consumers
    // get both wired up by simply forwarding the ARIA prop from RHF.
    const resolvedState = state ?? (ariaInvalid ? "error" : "default");
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={ariaInvalid}
        className={cn(inputVariants({ size, state: resolvedState, className }))}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
