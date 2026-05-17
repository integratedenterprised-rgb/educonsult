import Link from "next/link";
import { FileText, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <SearchX className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 font-heading text-base font-semibold">No matches</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or clearing the active filters.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-3 font-heading text-base font-semibold">No pages yet</h2>
      <p className="mt-1 text-sm text-muted-foreground">Create your first page to get started.</p>
      <Button asChild className="mt-5">
        <Link href="/admin/pages/new">
          <Plus className="mr-1 h-4 w-4" />
          New page
        </Link>
      </Button>
    </div>
  );
}
