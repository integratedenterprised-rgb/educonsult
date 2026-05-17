import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
      xl: "h-8 w-8",
    },
  },
  defaultVariants: { size: "sm" },
});

export interface SpinnerProps
  extends React.SVGAttributes<SVGElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export function Spinner({ size, className, label = "Loading", ...rest }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className="inline-flex">
      <Loader2 className={cn(spinnerVariants({ size }), className)} aria-hidden {...rest} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export { spinnerVariants };
