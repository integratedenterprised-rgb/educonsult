import { requirePermission } from "@/server/auth/session";
import { listMedia } from "@/server/media/admin-media.service";
import { MediaLibrary } from "@/components/admin/media/media-library";

export const dynamic = "force-dynamic";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("media.read");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const folder = typeof sp.folder === "string" ? sp.folder : "";
  const { rows, total, folders, page, totalPages } = await listMedia({
    query: q || undefined,
    folder: folder || undefined,
    page: Number(sp.page) || 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Media library</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} items across {folders.length || 1} folders.</p>
      </div>

      <MediaLibrary
        initialItems={rows}
        initialPage={page}
        totalPages={totalPages}
        folders={folders}
        currentFolder={folder}
        currentQuery={q}
      />
    </div>
  );
}
