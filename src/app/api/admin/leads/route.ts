import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { leadCreateSchema, leadListQuerySchema } from "@/lib/validators/lead";
import { createLead, listLeads } from "@/server/leads/admin.service";
import { ensurePermission } from "./_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await ensurePermission("leads.read");
  if (response) return response;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = leadListQuerySchema.safeParse(params);
  if (!parsed.success) return ApiErrors.badRequest("Invalid query", parsed.error.flatten());

  return ok(await listLeads(parsed.data));
}

export async function POST(req: NextRequest) {
  const { user, response } = await ensurePermission("leads.write");
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = leadCreateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const lead = await createLead(parsed.data, user.id);
    return ok({ id: lead.id });
  } catch (e) {
    console.error("createLead failed", e);
    return ApiErrors.serverError();
  }
}
