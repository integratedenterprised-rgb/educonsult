import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { countryUpsertSchema } from "@/lib/validators/career";
import { createCountry, listCountries } from "@/server/career/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await ensurePermission("career.read");
  if (response) return response;
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const rows = await listCountries({ status });
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
  const parsed = countryUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const country = await createCountry(parsed.data);
    return ok({ id: country.id, code: country.code });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return ApiErrors.badRequest("A country with this code or slug already exists");
    }
    console.error("createCountry failed", e);
    return ApiErrors.serverError();
  }
}
