import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full px-4 sm:px-6 lg:px-8", {
  variants: {
    width: {
      narrow: "max-w-3xl",
      default: "max-w-6xl",
      wide: "max-w-7xl",
      full: "max-w-none",
    },
  },
  defaultVariants: { width: "default" },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: keyof React.JSX.IntrinsicElements;
}

export function Container({ className, width, as = "div", children, ...rest }: ContainerProps) {
  const Tag = as as "div";
  return (
    <Tag className={cn(containerVariants({ width, className }))} {...rest}>
      {children}
    </Tag>
  );
}

export { containerVariants };
