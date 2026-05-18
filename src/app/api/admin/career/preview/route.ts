/**
 * Admin "preview" endpoint — dry-run the recommendation engine against a
 * sample profile so admins can validate weight/data changes before they go
 * live. Returns the full result including dimension scores and the applied
 * weight overrides.
 */
import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiErrors, ok } from "@/server/api/response";
import {
  careerCategoryWeightsSchema,
  careerProfileSchema,
  careerScoreBucketsSchema,
} from "@/lib/validators/career";
import { previewRecommendations } from "@/server/career/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const previewSchema = z.object({
  profile: careerProfileSchema,
  locale: z.enum(["EN", "NE", "HI", "ZH"]).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  categoryWeights: careerCategoryWeightsSchema.optional(),
  buckets: careerScoreBucketsSchema.optional(),
});

export async function POST(req: NextRequest) {
  const { response } = await ensurePermission("career.read");
  if (response) return response;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = previewSchema.safeParse(raw);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const result = await previewRecommendations(parsed.data.profile, {
      locale: parsed.data.locale,
      limit: parsed.data.limit,
      categoryWeights: parsed.data.categoryWeights,
      buckets: parsed.data.buckets,
    });
    return ok(result);
  } catch (e) {
    console.error("career preview failed", e);
    return ApiErrors.serverError();
  }
}
