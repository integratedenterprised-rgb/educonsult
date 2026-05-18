import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { ruleUpdateSchema } from "@/lib/validators/visa-risk";
import { deleteRule, getRule, updateRule } from "@/server/visa-risk/admin.service";
import { ensurePermission } from "../../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("visa-risk.read");
  if (response) return response;
  const { id } = await params;
  const rule = await getRule(id);
  if (!rule) return ApiErrors.notFound("Rule");
  return ok(rule);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("visa-risk.write");
  if (response) return response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = ruleUpdateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    await updateRule(id, parsed.data);
    return ok({ id });
  } catch (e) {
    if (e instanceof Error && e.message === "RULE_NOT_FOUND") return ApiErrors.notFound("Rule");
    console.error("updateRule failed", e);
    return ApiErrors.serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("visa-risk.write");
  if (response) return response;
  const { id } = await params;
  try {
    await deleteRule(id);
    return ok({ id });
  } catch (e) {
    console.error("deleteRule failed", e);
    return ApiErrors.serverError();
  }
}
