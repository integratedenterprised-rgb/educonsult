"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Tabs — Radix tabs with three visual variants:
 *
 *  - `default`    Segmented control (pill in muted background)
 *  - `underline`  Active tab underlined, no background
 *  - `pills`      Active tab gets primary background
 *
 * The variant is set on `<TabsList>`; triggers inside automatically pick up
 * the right styling via a React context shared by List and Trigger.
 */

type TabsVariant = "default" | "underline" | "pills";

const TabsVariantContext = React.createContext<TabsVariant>("default");

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva("inline-flex items-center text-muted-foreground", {
  variants: {
    variant: {
      default: "h-9 justify-center rounded-lg bg-muted p-1",
      underline: "gap-4 border-b border-border",
      pills: "gap-1 rounded-lg p-1",
    },
  },
  defaultVariants: { variant: "default" },
});

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant, ...props }, ref) => {
    const resolved = variant ?? "default";
    return (
      <TabsVariantContext.Provider value={resolved}>
        <TabsPrimitive.List
          ref={ref}
          className={cn(tabsListVariants({ variant: resolved, className }))}
          {...props}
        />
      </TabsVariantContext.Provider>
    );
  },
);
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-md px-3 py-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        underline:
          "border-b-2 border-transparent px-1 py-2 data-[state=active]:border-foreground data-[state=active]:text-foreground",
        pills:
          "rounded-md px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant, className }))}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
