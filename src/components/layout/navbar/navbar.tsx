/**
 * Navbar shell.
 *
 * Server component — fetches nav links + site settings at request time. No
 * content is hardcoded. Logo, brand name, and all menu items come from the CMS.
 * The mobile drawer is delegated to the client-only `NavbarMobile` so this
 * file stays a server component (and ships zero JS for the desktop view).
 */
import Link from "next/link";
import Image from "next/image";
import { getHeaderNav } from "@/server/cms/nav.service";
import { getSiteSettings } from "@/server/cms/settings.service";
import { Container } from "@/components/layout/container";
import { NavbarMobile } from "./navbar-mobile";
import { NavbarDesktop } from "./navbar-desktop";

export async function Navbar() {
  const [nav, settings] = await Promise.all([getHeaderNav(), getSiteSettings()]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2" aria-label={settings.name}>
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.name}
              width={120}
              height={32}
              sizes="120px"
              className="h-8 w-auto"
              priority
            />
          ) : (
            <span className="font-heading text-lg font-semibold tracking-tight">{settings.name}</span>
          )}
        </Link>

        <NavbarDesktop links={nav} />
        <NavbarMobile links={nav} brandName={settings.name} logoUrl={settings.logoUrl} />
      </Container>
    </header>
  );
}
