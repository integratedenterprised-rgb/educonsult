import Link from "next/link";
import type { NavLink } from "@/types/cms";
import { Button } from "@/components/ui/atoms/button";

export function NavbarDesktop({ links }: { links: NavLink[] }) {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      <ul className="flex items-center gap-1">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              href={link.url}
              target={link.openInNew ? "_blank" : undefined}
              rel={link.openInNew ? "noopener noreferrer" : undefined}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <Button asChild size="sm" className="ml-3">
        <Link href="/contact">Get Started</Link>
      </Button>
    </nav>
  );
}
