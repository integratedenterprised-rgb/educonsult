"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, type NavItem } from "./nav-config";
import { NavIcon } from "./icon";

interface SidebarProps {
  /** Permission keys the current user holds — items missing their permission are hidden. */
  permissions: string[];
  user: { name: string; email: string; role: string } | null;
}

function isActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ permissions, user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const allowed = (item: NavItem) => !item.permission || permissions.includes(item.permission);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-card transition-[width]",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        <Link href="/admin" className={cn("font-heading text-sm font-semibold", collapsed && "sr-only")}>
          Admin
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(allowed);
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item.href, pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded px-2 py-1.5 text-sm",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-border p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.role}</p>
              </div>
              <Link href="/api/auth/signout" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <Link href="/api/auth/signout" className="grid h-8 w-8 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
