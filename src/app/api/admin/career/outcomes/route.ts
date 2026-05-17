import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { courseOutcomeUpsertSchema } from "@/lib/validators/career";
import { upsertCourseOutcome } from "@/server/career/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { response } = await ensurePermission("career.write");
  if (response) return response;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = courseOutcomeUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const row = await upsertCourseOutcome(parsed.data);
    return ok({ id: row.id });
  } catch (e) {
    console.error("upsertCourseOutcome failed", e);
    return ApiErrors.serverError();
  }
}
