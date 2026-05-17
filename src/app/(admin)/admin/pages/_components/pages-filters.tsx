"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/atoms/input";
import { Button } from "@/components/ui/atoms/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/molecules/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { usePagesSearchParams } from "./use-pages-search-params";

const ALL = "__ALL__";

interface PagesFiltersProps {
  initialQuery: string;
  initialStatus: string;
  initialTemplate: string;
  initialHomepage: string;
  templates: string[];
}

export function PagesFilters({
  initialQuery,
  initialStatus,
  initialTemplate,
  initialHomepage,
  templates,
}: PagesFiltersProps) {
  const { search, setParams } = usePagesSearchParams();
  const [queryInput, setQueryInput] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(queryInput, 300);

  // Push the debounced search to the URL whenever it changes from the URL
  // value. Reset to page 1 on any new query.
  useEffect(() => {
    const current = search.get("q") ?? "";
    if (debouncedQuery !== current) {
      setParams({ q: debouncedQuery || null }, { resetPage: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const hasActiveFilters =
    queryInput !== "" ||
    (initialStatus && initialStatus !== ALL) ||
    (initialTemplate && initialTemplate !== ALL) ||
    (initialHomepage && initialHomepage !== ALL);

  function clearAll() {
    setQueryInput("");
    setParams(
      { q: null, status: null, template: null, isHomepage: null, page: null },
      { resetPage: true },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Search by title or slug…"
          className="pl-9 pr-9"
        />
        {queryInput ? (
          <button
            type="button"
            onClick={() => setQueryInput("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-shrink-0">
        <FilterSelect
          width="w-36"
          value={initialStatus || ALL}
          onChange={(v) => setParams({ status: v === ALL ? null : v }, { resetPage: true })}
          placeholder="Status"
          options={[
            { value: ALL, label: "All statuses" },
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
        <FilterSelect
          width="w-40"
          value={initialTemplate || ALL}
          onChange={(v) => setParams({ template: v === ALL ? null : v }, { resetPage: true })}
          placeholder="Template"
          options={[
            { value: ALL, label: "All templates" },
            ...templates.map((t) => ({ value: t, label: t })),
          ]}
        />
        <FilterSelect
          width="w-40"
          value={initialHomepage || ALL}
          onChange={(v) => setParams({ isHomepage: v === ALL ? null : v }, { resetPage: true })}
          placeholder="Homepage"
          options={[
            { value: ALL, label: "All pages" },
            { value: "true", label: "Homepage only" },
            { value: "false", label: "Non-homepage" },
          ]}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          disabled={!hasActiveFilters}
          className={cn("lg:w-auto", !hasActiveFilters && "opacity-0 pointer-events-none")}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  width: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-9", width)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
