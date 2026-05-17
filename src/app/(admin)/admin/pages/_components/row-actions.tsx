"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/organisms/dropdown-menu";
import { DeletePageDialog } from "./delete-page-dialog";

interface RowActionsProps {
  pageId: string;
  pageTitle: string;
  publicUrl: string;
  isHomepage: boolean;
}

export function RowActions({ pageId, pageTitle, publicUrl, isHomepage }: RowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Row actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/pages/${pageId}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View on site
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            disabled={isHomepage}
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePageDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        pageId={pageId}
        pageTitle={pageTitle}
      />
    </>
  );
}
