"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "../atoms/label";
import { cn } from "@/lib/utils";

const fieldVariants = cva("", {
  variants: {
    density: {
      comfortable: "space-y-1.5",
      compact: "space-y-1",
    },
  },
  defaultVariants: { density: "comfortable" },
});

/**
 * Field — label + control + error/hint molecule.
 *
 * `density` controls the vertical rhythm. Empty `label` is allowed for layouts
 * where the control already carries its own labelling (e.g., search inputs).
 */
export interface FieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof fieldVariants> {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  density,
  className,
  children,
  ...rest
}: FieldProps) {
  return (
    <div className={cn(fieldVariants({ density, className }))} {...rest}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export { fieldVariants };
