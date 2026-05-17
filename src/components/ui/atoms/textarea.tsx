import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex w-full rounded-md border bg-background shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "min-h-[64px] px-2.5 py-1.5 text-xs",
        md: "min-h-[80px] px-3 py-2 text-sm",
        lg: "min-h-[120px] px-4 py-3 text-base",
      },
      state: {
        default: "border-input focus-visible:ring-ring",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-emerald-500 focus-visible:ring-emerald-500",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        both: "resize",
      },
    },
    defaultVariants: { size: "md", state: "default", resize: "vertical" },
  },
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, state, resize, "aria-invalid": ariaInvalid, ...props }, ref) => {
    const resolvedState = state ?? (ariaInvalid ? "error" : "default");
    return (
      <textarea
        ref={ref}
        aria-invalid={ariaInvalid}
        className={cn(textareaVariants({ size, state: resolvedState, resize, className }))}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
