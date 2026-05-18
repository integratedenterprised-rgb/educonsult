import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { countryUpdateSchema } from "@/lib/validators/career";
import { deleteCountry, getCountry, updateCountry } from "@/server/career/admin.service";
import { ensurePermission } from "../../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("career.read");
  if (response) return response;
  const { id } = await ctx.params;
  const row = await getCountry(id);
  if (!row) return ApiErrors.notFound("Country");
  return ok(row);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("career.write");
  if (response) return response;
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = countryUpdateSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const row = await updateCountry(id, parsed.data);
    return ok({ id: row.id });
  } catch (e) {
    if (e instanceof Error && e.message === "COUNTRY_NOT_FOUND")
      return ApiErrors.notFound("Country");
    console.error("updateCountry failed", e);
    return ApiErrors.serverError();
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { response } = await ensurePermission("career.write");
  if (response) return response;
  const { id } = await ctx.params;
  try {
    await deleteCountry(id);
    return ok({ id });
  } catch (e) {
    console.error("deleteCountry failed", e);
    return ApiErrors.serverError();
  }
}
