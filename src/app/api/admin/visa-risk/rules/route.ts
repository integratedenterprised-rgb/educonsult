import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { ruleUpsertSchema } from "@/lib/validators/visa-risk";
import { createRule, listRules } from "@/server/visa-risk/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await ensurePermission("visa-risk.read");
  if (response) return response;

  const params = req.nextUrl.searchParams;
  const countryCode = params.get("country");
  const isActiveParam = params.get("active");
  const rules = await listRules({
    countryCode: countryCode === "global" ? null : countryCode,
    isActive: isActiveParam === null ? undefined : isActiveParam === "true",
  });
  return ok(rules);
}

export async function POST(req: NextRequest) {
  const { response } = await ensurePermission("visa-risk.write");
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = ruleUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const rule = await createRule(parsed.data);
    return ok({ id: rule.id });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return ApiErrors.badRequest("A rule with this key already exists");
    }
    console.error("createRule failed", e);
    return ApiErrors.serverError();
  }
}
