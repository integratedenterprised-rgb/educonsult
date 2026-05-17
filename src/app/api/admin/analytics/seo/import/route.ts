/**
 * GSC CSV import.
 *
 * Accepts a multipart upload with a single `file` field (a Google Search
 * Console export) or a JSON body `{ rows: GscRow[] }` for API-driven syncs.
 */
import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { importGscRows, parseGscCsv, type GscRow } from "@/server/analytics/seo.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("analytics.write");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }

  const ct = req.headers.get("content-type") ?? "";
  let rows: GscRow[] = [];

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return ApiErrors.badRequest("Missing file");
    const csv = await file.text();
    rows = parseGscCsv(csv);
  } else if (ct.includes("application/json")) {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return ApiErrors.badRequest("Invalid JSON body");
    }
    if (typeof raw === "object" && raw && Array.isArray((raw as { rows?: unknown }).rows)) {
      rows = (raw as { rows: GscRow[] }).rows;
    } else {
      return ApiErrors.badRequest("Body must be { rows: GscRow[] }");
    }
  } else {
    const text = await req.text();
    rows = parseGscCsv(text);
  }

  if (rows.length === 0) return ApiErrors.badRequest("No valid rows in upload");
  const result = await importGscRows(rows);
  return ok(result);
}
