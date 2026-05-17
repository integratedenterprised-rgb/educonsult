/**
 * Admin CRUD for the footer (columns + links).
 *
 * Same full-replace-in-transaction pattern as the nav editor. `key` on
 * FooterColumn is `@unique`; the client supplies one (uuid for new columns).
 * Since we delete then recreate inside one transaction, key collisions can
 * only happen against rows in *another* footer concept — which doesn't exist
 * here. If we ever introduce multiple footers, this service grows a key
 * parameter the same way `admin-nav.service.ts` did.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { FooterInput } from "@/lib/validators/footer";
import { invalidateNavCache } from "./nav.service";

export interface AdminFooterLink {
  id: string;
  label: string;
  url: string;
  openInNew: boolean;
  isVisible: boolean;
}

export interface AdminFooterColumn {
  id: string;
  key: string;
  heading: string;
  isActive: boolean;
  links: AdminFooterLink[];
}

export async function getAdminFooter(): Promise<AdminFooterColumn[]> {
  const cols = await prisma.footerColumn.findMany({
    orderBy: { order: "asc" },
    include: { links: { orderBy: { order: "asc" } } },
  });
  return cols.map((c) => ({
    id: c.id,
    key: c.key,
    heading: c.heading,
    isActive: c.isActive,
    links: c.links.map((l) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      openInNew: l.openInNew,
      isVisible: l.isVisible,
    })),
  }));
}

export async function saveFooter(input: FooterInput) {
  await prisma.$transaction(async (tx) => {
    // Cascades wipe FooterLink rows by FK on delete.
    await tx.footerColumn.deleteMany({});

    let colOrder = 0;
    for (const col of input.columns) {
      await tx.footerColumn.create({
        data: {
          key: col.key,
          heading: col.heading,
          isActive: col.isActive,
          order: colOrder++,
          links: {
            create: col.links.map((l, i) => ({
              label: l.label,
              url: l.url,
              openInNew: l.openInNew,
              isVisible: l.isVisible,
              order: i,
            })),
          },
        },
      });
    }
  });

  invalidateNavCache();
}
