"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";
import type { ApiResponse } from "@/types/api";

interface DeletePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  pageTitle: string;
}

export function DeletePageDialog({ open, onOpenChange, pageId, pageTitle }: DeletePageDialogProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/pages/${pageId}`, { method: "DELETE" });
    const json = (await res.json()) as ApiResponse<unknown>;
    setPending(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this page?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{pageTitle}</span> will be moved to the archive
            and removed from the public site. This can be undone by restoring from the database.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
