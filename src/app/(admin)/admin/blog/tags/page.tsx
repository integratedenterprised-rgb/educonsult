import { listAdminTags } from "@/server/cms/admin-blog.service";
import { requirePermission } from "@/server/auth/session";
import { TagsAdmin } from "./tags-admin";

export const dynamic = "force-dynamic";

export default async function TagsRoute() {
  await requirePermission("blog.write");
  const rows = await listAdminTags();
  return (
    <TagsAdmin
      initialTags={rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, postCount: r._count.posts }))}
    />
  );
}
