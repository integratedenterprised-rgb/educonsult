"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ChevronRight } from "lucide-react";
import { NAV_GROUPS } from "./nav-config";

function findCrumb(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [{ label: "Admin", href: "/admin" }];
  if (pathname === "/admin") return crumbs;
  for (const g of NAV_GROUPS) {
    for (const i of g.items) {
      if (pathname === i.href || pathname.startsWith(i.href + "/")) {
        crumbs.push({ label: i.label, href: i.href });
        break;
      }
    }
  }
  return crumbs;
}

export function Topbar() {
  const pathname = usePathname();
  const crumbs = findCrumb(pathname);
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {i === crumbs.length - 1 ? (
              <span className="font-medium">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-muted-foreground hover:text-foreground">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View site
        </Link>
      </div>
    </header>
  );
}
