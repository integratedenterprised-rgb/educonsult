/**
 * Footer shell.
 *
 * Pure server component. Columns, links, brand name, tagline, contact info,
 * and social handles are all CMS-driven. Adding a column or link is a row in
 * the database — no code change required.
 */
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { getFooterColumns } from "@/server/cms/nav.service";
import { getSiteSettings } from "@/server/cms/settings.service";
import { Container } from "@/components/layout/container";

export async function Footer() {
  const [columns, settings] = await Promise.all([getFooterColumns(), getSiteSettings()]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card text-card-foreground">
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2">
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt={settings.name}
                  width={120}
                  height={32}
                  sizes="120px"
                  className="h-8 w-auto"
                  loading="lazy"
                />
              ) : (
                <span className="font-heading text-lg font-semibold">{settings.name}</span>
              )}
            </Link>
            {settings.tagline ? (
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">{settings.tagline}</p>
            ) : null}
            <SocialRow social={settings.social} />
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {columns.map((col) => (
              <div key={col.id}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider">{col.heading}</h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.url}
                        target={link.openInNew ? "_blank" : undefined}
                        rel={link.openInNew ? "noopener noreferrer" : undefined}
                        className="text-sm text-muted-foreground transition hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>
            © {year} {settings.name}. All rights reserved.
          </p>
          {settings.contact.email ? (
            <a href={`mailto:${settings.contact.email}`} className="hover:text-foreground">
              {settings.contact.email}
            </a>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}

function SocialRow({ social }: { social: { facebook: string; instagram: string; linkedin: string } }) {
  const items = [
    { url: social.facebook, Icon: Facebook, label: "Facebook" },
    { url: social.instagram, Icon: Instagram, label: "Instagram" },
    { url: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
  ].filter((i) => i.url);

  if (!items.length) return null;
  return (
    <div className="mt-4 flex items-center gap-3">
      {items.map(({ url, Icon, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
