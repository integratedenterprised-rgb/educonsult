import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";
import type { FooterColumnDto, NavLink } from "@/types/cms";

const NAV_TAG = "cms:nav";

interface FlatNavItem {
  id: string;
  parentId: string | null;
  label: string;
  url: string;
  iconKey: string | null;
  order: number;
  openInNew: boolean;
}

function buildTree(items: FlatNavItem[]): NavLink[] {
  const byParent = new Map<string | null, FlatNavItem[]>();
  for (const item of items) {
    const list = byParent.get(item.parentId) ?? [];
    list.push(item);
    byParent.set(item.parentId, list);
  }
  const walk = (parentId: string | null): NavLink[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((i) => ({
        id: i.id,
        label: i.label,
        url: i.url,
        iconKey: i.iconKey,
        openInNew: i.openInNew,
        children: walk(i.id),
      }));
  return walk(null);
}

export const getHeaderNav = unstable_cache(
  async (): Promise<NavLink[]> => {
    const menu = await prisma.navMenu.findUnique({
      where: { key: "header-main" },
      include: {
        items: {
          where: { isVisible: true },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!menu) return [];
    return buildTree(
      menu.items.map((i) => ({
        id: i.id,
        parentId: i.parentId,
        label: i.label,
        url: i.url,
        iconKey: i.iconKey,
        order: i.order,
        openInNew: i.openInNew,
      })),
    );
  },
  ["header-nav"],
  { revalidate: siteConfig.cache.nav, tags: [NAV_TAG] },
);

export const getFooterColumns = unstable_cache(
  async (): Promise<FooterColumnDto[]> => {
    const cols = await prisma.footerColumn.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { links: { where: { isVisible: true }, orderBy: { order: "asc" } } },
    });
    return cols.map((c) => ({
      id: c.id,
      heading: c.heading,
      order: c.order,
      links: c.links.map((l) => ({
        id: l.id,
        label: l.label,
        url: l.url,
        openInNew: l.openInNew,
      })),
    }));
  },
  ["footer-columns"],
  { revalidate: siteConfig.cache.nav, tags: [NAV_TAG] },
);

export function invalidateNavCache() {
  revalidateTag(NAV_TAG);
}
