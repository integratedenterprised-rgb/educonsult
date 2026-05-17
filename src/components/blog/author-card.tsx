/**
 * Author card — rendered at the end of every article and on the author page.
 *
 * Optional Twitter / LinkedIn / email handles render as small icons.
 */
import Link from "next/link";
import Image from "next/image";
import { Linkedin, Twitter, Mail } from "lucide-react";

interface Props {
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  twitter: string | null;
  linkedin: string | null;
  /** When true, omits the "View all posts" link (already on the author page). */
  isOnAuthorPage?: boolean;
}

export function AuthorCard({
  slug,
  name,
  title,
  bio,
  avatarUrl,
  email,
  twitter,
  linkedin,
  isOnAuthorPage,
}: Props) {
  return (
    <section className="mt-12 flex items-start gap-4 rounded-xl border border-border bg-card p-6">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={64}
          height={64}
          sizes="64px"
          loading="lazy"
          className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xl">
          {name.charAt(0)}
        </span>
      )}
      <div className="flex-1">
        <h3 className="font-heading text-lg font-semibold">
          {isOnAuthorPage ? name : <Link href={`/authors/${slug}`} className="hover:underline">{name}</Link>}
        </h3>
        {title ? <p className="text-sm text-muted-foreground">{title}</p> : null}
        {bio ? <p className="mt-2 text-sm">{bio}</p> : null}
        <div className="mt-3 flex items-center gap-3">
          {twitter ? (
            <a
              href={`https://twitter.com/${twitter.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} on Twitter`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Twitter className="h-4 w-4" />
            </a>
          ) : null}
          {linkedin ? (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} on LinkedIn`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              aria-label={`Email ${name}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
            </a>
          ) : null}
        </div>
        {!isOnAuthorPage ? (
          <Link
            href={`/authors/${slug}`}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            View all posts →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
