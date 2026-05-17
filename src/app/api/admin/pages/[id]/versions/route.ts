import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Ctx) {
  try { await requirePermission("pages.read"); }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
  const { id } = await params;
  const rows = await prisma.pageVersion.findMany({
    where: { pageId: id },
    orderBy: { version: "desc" },
    take: 50,
    select: { id: true, version: true, changeNote: true, createdAt: true, createdById: true },
  });
  return ok(rows);
}
