import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { prPathwayUpsertSchema } from "@/lib/validators/career";
import { createPrPathway, listPrPathways } from "@/server/career/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await ensurePermission("career.read");
  if (response) return response;
  const params = req.nextUrl.searchParams;
  const rows = await listPrPathways({
    countryCode: params.get("country") ?? undefined,
    type: params.get("type") ?? undefined,
  });
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const { response } = await ensurePermission("career.write");
  if (response) return response;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = prPathwayUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const row = await createPrPathway(parsed.data);
    return ok({ id: row.id });
  } catch (e) {
    if (e instanceof Error && e.message === "COUNTRY_NOT_FOUND")
      return ApiErrors.badRequest("Unknown destination country");
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return ApiErrors.badRequest("A pathway with this slug already exists");
    }
    console.error("createPrPathway failed", e);
    return ApiErrors.serverError();
  }
}
