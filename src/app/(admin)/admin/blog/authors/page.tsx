import { listAdminAuthors } from "@/server/cms/admin-blog.service";
import { requirePermission } from "@/server/auth/session";
import { AuthorsAdmin } from "./authors-admin";

export const dynamic = "force-dynamic";

export default async function AuthorsRoute() {
  await requirePermission("blog.write");
  const rows = await listAdminAuthors();
  return (
    <AuthorsAdmin
      initialAuthors={rows.map((r) => {
        const t = r.translations.find((x) => x.locale === "EN") ?? r.translations[0];
        return {
          id: r.id,
          slug: r.slug,
          name: t?.name ?? r.slug,
          title: t?.title ?? null,
          bio: t?.bio ?? null,
          avatarUrl: r.avatarUrl,
          email: r.email,
          twitter: r.twitter,
          linkedin: r.linkedin,
          postCount: r._count.posts,
        };
      })}
    />
  );
}
