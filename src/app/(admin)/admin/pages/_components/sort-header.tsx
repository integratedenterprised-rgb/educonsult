"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePagesSearchParams } from "./use-pages-search-params";

interface SortHeaderProps {
  field: "updatedAt" | "title" | "status";
  label: string;
  currentSort: string;
  currentOrder: "asc" | "desc";
  className?: string;
}

export function SortHeader({ field, label, currentSort, currentOrder, className }: SortHeaderProps) {
  const { setParams } = usePagesSearchParams();
  const isActive = currentSort === field;

  function toggle() {
    if (!isActive) {
      setParams({ sort: field, order: field === "title" ? "asc" : "desc" });
      return;
    }
    setParams({ sort: field, order: currentOrder === "asc" ? "desc" : "asc" });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "group inline-flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
      )}
    </button>
  );
}
