import { listAdminCategories } from "@/server/cms/admin-blog.service";
import { requirePermission } from "@/server/auth/session";
import { CategoriesAdmin } from "./categories-admin";

export const dynamic = "force-dynamic";

export default async function CategoriesRoute() {
  await requirePermission("blog.write");
  const rows = await listAdminCategories();
  const items = rows.map((r) => {
    const t = r.translations.find((x) => x.locale === "EN") ?? r.translations[0];
    return {
      id: r.id,
      slug: r.slug,
      name: t?.name ?? r.slug,
      description: t?.description ?? null,
      iconUrl: r.iconUrl,
      order: r.order,
      postCount: r._count.posts,
    };
  });
  return <CategoriesAdmin initialCategories={items} />;
}
