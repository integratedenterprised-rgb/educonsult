import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { createCountry, listCountries, CODE_TAKEN, SLUG_TAKEN } from "@/server/cms/admin-country.service";
import { countryUpsertSchema } from "@/lib/validators/country";

async function guard(level: "countries.read" | "countries.write") {
  try { await requirePermission(level); return null; }
  catch (e) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return msg === "FORBIDDEN" ? ApiErrors.forbidden() : ApiErrors.unauthorized();
  }
}

export async function GET() {
  const g = await guard("countries.read"); if (g) return g;
  return ok(await listCountries());
}

export async function POST(req: Request) {
  const g = await guard("countries.write"); if (g) return g;
  let body: unknown;
  try { body = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON"); }
  const parsed = countryUpsertSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  try {
    const c = await createCountry({
      ...parsed.data,
      flagUrl: parsed.data.flagUrl || null,
      imageUrl: parsed.data.imageUrl || null,
    });
    return ok({ id: c.id });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === CODE_TAKEN) return ApiErrors.badRequest("Country code already used", { field: "code" });
      if (e.message === SLUG_TAKEN) return ApiErrors.badRequest("Slug already used", { field: "slug" });
    }
    return ApiErrors.serverError();
  }
}
