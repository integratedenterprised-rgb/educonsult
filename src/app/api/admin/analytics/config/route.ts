/**
 * Heatmap / pixel provider configuration.
 *
 * GET returns the full row (including the IP salt) — only readable by users
 * with `analytics.write` to avoid leaking the salt to read-only viewers.
 */
import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiErrors, ok } from "@/server/api/response";
import { requirePermission } from "@/server/auth/session";
import {
  getAnalyticsConfig,
  rotateIpHashSalt,
  updateAnalyticsConfig,
} from "@/server/analytics/config.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("analytics.write");
  } catch (e) {
    return (e as Error).message === "UNAUTHORIZED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
  }
  const cfg = await getAnalyticsConfig();
  return ok(cfg);
}

const updateSchema = z.object({
  ga4MeasurementId: z.string().max(40).nullable().optional(),
  gtmContainerId: z.string().max(40).nullable().optional(),
  metaPixelId: z.string().max(40).nullable().optional(),
  heatmapProvider: z.enum(["NONE", "CLARITY", "HOTJAR", "POSTHOG", "FULLSTORY"]).optional(),
  clarityProjectId: z.string().max(40).nullable().optional(),
  hotjarSiteId: z.string().max(40).nullable().optional(),
  posthogApiKey: z.string().max(200).nullable().optional(),
  posthogHost: z.string().url().max(200).nullable().optional(),
  fullstoryOrgId: z.string().max(40).nullable().optional(),
  respectDoNotTrack: z.boolean().optional(),
  requireConsent: z.boolean().optional(),
  gscSiteUrl: z.string().max(200).nullable().optional(),
  rotateSalt: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
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
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  const { rotateSalt, ...rest } = parsed.data;
  const updated = await updateAnalyticsConfig(rest);
  if (rotateSalt) await rotateIpHashSalt();
  return ok(updated);
}
