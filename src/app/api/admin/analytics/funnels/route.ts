/**
 * Funnel management + live computation.
 *
 * GET  → list funnels, with last-30-day computed stats.
 * POST → create a funnel (admins only).
 */
import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import {
  computeFunnel,
  createFunnel,
  listFunnels,
} from "@/server/analytics/funnel.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("analytics.read");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  const days = Number(req.nextUrl.searchParams.get("days") ?? "30") || 30;
  const funnels = await listFunnels();
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const results = await Promise.all(
    funnels.map((f) => computeFunnel(f, { rangeStart: start, rangeEnd: end })),
  );
  return ok({ funnels: results });
}

const createSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  windowHours: z.number().int().min(1).max(24 * 90).optional(),
  steps: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        eventType: z.string().min(1),
        filter: z.record(z.unknown()).optional(),
      }),
    )
    .min(2)
    .max(12),
});

export async function POST(req: NextRequest) {
  try {
    await requirePermission("analytics.write");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid body");
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  // eventType strings will be validated by Prisma against the enum at write time.
  const funnel = await createFunnel({
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description,
    windowHours: parsed.data.windowHours,
    steps: parsed.data.steps as never,
  });
  return ok(funnel);
}
