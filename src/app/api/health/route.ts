import { prisma } from "@/lib/prisma";
import { ok, ApiErrors } from "@/server/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok", db: "reachable" });
  } catch {
    return ApiErrors.serverError();
  }
}
