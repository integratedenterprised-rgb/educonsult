/**
 * Funnel detail — update or compute over a custom range.
 */
import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import { computeFunnel, updateFunnel } from "@/server/analytics/funnel.service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("analytics.read");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  const { id } = await params;
  const funnel = await prisma.funnelDefinition.findUnique({ where: { id } });
  if (!funnel) return ApiErrors.notFound("Funnel");
  const days = Number(req.nextUrl.searchParams.get("days") ?? "30") || 30;
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const result = await computeFunnel(funnel, { rangeStart: start, rangeEnd: end });
  return ok({ funnel, result });
}

const updateSchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  windowHours: z.number().int().min(1).max(24 * 90).optional(),
  isActive: z.boolean().optional(),
  steps: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        eventType: z.string().min(1),
        filter: z.record(z.unknown()).optional(),
      }),
    )
    .min(2)
    .max(12)
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("analytics.write");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  const { id } = await params;
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid body");
  }
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  const updated = await updateFunnel(id, parsed.data as never);
  return ok(updated);
}
