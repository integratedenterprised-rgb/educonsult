import { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import {
  careerCategoryWeightsSchema,
  careerScoreBucketsSchema,
} from "@/lib/validators/career";
import {
  getCategoryWeightsSetting,
  getScoreBucketsSetting,
  setCategoryWeights,
  setScoreBuckets,
} from "@/server/career/admin.service";
import { DEFAULT_CATEGORY_WEIGHTS, DEFAULT_SCORE_BUCKETS } from "@/server/career/weights";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the current weights + buckets (or defaults if not set). */
export async function GET() {
  const { response } = await ensurePermission("career.read");
  if (response) return response;
  const [weightsRow, bucketsRow] = await Promise.all([
    getCategoryWeightsSetting(),
    getScoreBucketsSetting(),
  ]);
  return ok({
    weights: weightsRow?.value ?? DEFAULT_CATEGORY_WEIGHTS,
    buckets: bucketsRow?.value ?? DEFAULT_SCORE_BUCKETS,
  });
}

/**
 * PATCH { weights?: {...}, buckets?: {...} } — partial update, validates each
 * shape independently so admins can adjust one without the other.
 */
export async function PATCH(req: NextRequest) {
  const { response } = await ensurePermission("career.write");
  if (response) return response;

  let body: { weights?: unknown; buckets?: unknown };
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  if (body.weights !== undefined) {
    const parsed = careerCategoryWeightsSchema.safeParse(body.weights);
    if (!parsed.success) return ApiErrors.badRequest("Invalid weights", parsed.error.flatten());
    await setCategoryWeights(parsed.data);
  }
  if (body.buckets !== undefined) {
    const parsed = careerScoreBucketsSchema.safeParse(body.buckets);
    if (!parsed.success) return ApiErrors.badRequest("Invalid buckets", parsed.error.flatten());
    await setScoreBuckets(parsed.data);
  }
  const [weightsRow, bucketsRow] = await Promise.all([
    getCategoryWeightsSetting(),
    getScoreBucketsSetting(),
  ]);
  return ok({
    weights: weightsRow?.value ?? DEFAULT_CATEGORY_WEIGHTS,
    buckets: bucketsRow?.value ?? DEFAULT_SCORE_BUCKETS,
  });
}
