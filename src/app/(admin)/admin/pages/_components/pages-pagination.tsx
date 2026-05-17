"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { usePagesSearchParams } from "./use-pages-search-params";

interface PagesPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function PagesPagination({ page, totalPages, total, pageSize }: PagesPaginationProps) {
  const { setParams } = usePagesSearchParams();

  if (totalPages <= 1) {
    return (
      <p className="text-xs text-muted-foreground">
        {total === 0 ? "No pages match these filters" : `${total} ${total === 1 ? "page" : "pages"}`}
      </p>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function go(next: number) {
    setParams({ page: next === 1 ? null : String(next) });
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <span className="px-2 text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
