import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    shape: {
      rect: "rounded-md",
      circle: "rounded-full",
      text: "rounded h-4",
      pill: "rounded-full h-6",
    },
  },
  defaultVariants: { shape: "rect" },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, shape, role = "status", ...props }: SkeletonProps) {
  return (
    <div
      role={role}
      aria-hidden="true"
      className={cn(skeletonVariants({ shape, className }))}
      {...props}
    />
  );
}

export { skeletonVariants };
