/**
 * Admin CRUD for navigation menus.
 *
 * Save strategy: full-tree replace inside a `$transaction`. The editor sends
 * the entire item tree on every save; the server clears existing items for
 * the menu and re-creates them with fresh `parentId` and `order` values.
 *
 * Trade-off: NavItem IDs are not stable across saves. That's acceptable —
 * nothing outside the menu references them, and the alternative
 * (diff-by-id upserts) adds complexity for marginal benefit at this scale.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { NavItemInput, NavMenuInput } from "@/lib/validators/nav-menu";
import { invalidateNavCache } from "./nav.service";

export interface NavMenuTreeItem {
  id: string;
  label: string;
  url: string;
  openInNew: boolean;
  isVisible: boolean;
  children: NavMenuTreeItem[];
}

export interface NavMenuTree {
  id: string;
  key: string;
  location: string;
  items: NavMenuTreeItem[];
}

function buildTree(
  flat: Array<{
    id: string;
    parentId: string | null;
    label: string;
    url: string;
    openInNew: boolean;
    isVisible: boolean;
    order: number;
  }>,
): NavMenuTreeItem[] {
  const byParent = new Map<string | null, typeof flat>();
  for (const item of flat) {
    const arr = byParent.get(item.parentId) ?? [];
    arr.push(item);
    byParent.set(item.parentId, arr);
  }
  const walk = (parentId: string | null): NavMenuTreeItem[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((i) => ({
        id: i.id,
        label: i.label,
        url: i.url,
        openInNew: i.openInNew,
        isVisible: i.isVisible,
        children: walk(i.id),
      }));
  return walk(null);
}

export async function getAdminNavMenu(menuKey: string): Promise<NavMenuTree | null> {
  const menu = await prisma.navMenu.findUnique({
    where: { key: menuKey },
    include: { items: true },
  });
  if (!menu) return null;
  return {
    id: menu.id,
    key: menu.key,
    location: menu.location,
    items: buildTree(menu.items),
  };
}

export async function saveNavMenu(menuKey: string, input: NavMenuInput) {
  await prisma.$transaction(async (tx) => {
    const menu = await tx.navMenu.findUnique({ where: { key: menuKey }, select: { id: true } });
    if (!menu) throw new Error("NOT_FOUND");

    await tx.navItem.deleteMany({ where: { menuId: menu.id } });

    const createSubtree = async (items: NavItemInput[], parentId: string | null) => {
      let order = 0;
      for (const item of items) {
        const created = await tx.navItem.create({
          data: {
            menuId: menu.id,
            parentId,
            label: item.label,
            url: item.url,
            openInNew: item.openInNew,
            isVisible: item.isVisible,
            order: order++,
          },
          select: { id: true },
        });
        if (item.children && item.children.length > 0) {
          await createSubtree(item.children, created.id);
        }
      }
    };

    await createSubtree(input.items, null);
  });

  invalidateNavCache();
}
