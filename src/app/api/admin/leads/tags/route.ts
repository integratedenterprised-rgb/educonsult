import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadTagUpsertSchema } from "@/lib/validators/lead";
import { listTags, upsertTag } from "@/server/leads/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await ensurePermission("leads.read");
  if (response) return response;
  return ok(await listTags());
}

export async function POST(req: NextRequest) {
  const { response } = await ensurePermission("leads.write");
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = leadTagUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const tag = await upsertTag(parsed.data);
    return ok(tag);
  } catch (e) {
    console.error("upsertTag failed", e);
    return ApiErrors.serverError();
  }
}
