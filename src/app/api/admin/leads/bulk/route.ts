import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadBulkActionSchema } from "@/lib/validators/lead";
import { bulkAction } from "@/server/leads/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await ensurePermission("leads.write");
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = leadBulkActionSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const result = await bulkAction(parsed.data, user.id);
    return ok(result);
  } catch (e) {
    console.error("bulkAction failed", e);
    if (e instanceof Error && e.message.startsWith("BULK_")) {
      return ApiErrors.badRequest(e.message);
    }
    return ApiErrors.serverError();
  }
}
