"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import type { NavLink } from "@/types/cms";
import { cn } from "@/lib/utils";

interface NavbarMobileProps {
  links: NavLink[];
  brandName: string;
  logoUrl: string;
}

export function NavbarMobile({ links, brandName, logoUrl }: NavbarMobileProps) {
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const toggle = useUiStore((s) => s.toggleMobileNav);
  const close = useUiStore((s) => s.closeMobileNav);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/80 hover:bg-accent md:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        className={cn(
          "fixed inset-0 top-16 z-30 transform bg-background transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-6 flex items-center gap-2">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={brandName}
                width={120}
                height={32}
                sizes="120px"
                className="h-8 w-auto"
                loading="lazy"
              />
            ) : (
              <span className="font-heading text-lg font-semibold">{brandName}</span>
            )}
          </div>
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.url}
                  onClick={close}
                  className="block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
