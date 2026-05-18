import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiErrors, ok } from "@/server/api/response";
import { bucketsSchema, categoryWeightsSchema } from "@/lib/validators/visa-risk";
import { getBuckets, getWeights, setBuckets, setWeights } from "@/server/visa-risk/admin.service";
import { ensurePermission } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const weightsPutSchema = z
  .object({
    weights: categoryWeightsSchema.optional(),
    buckets: bucketsSchema.optional(),
  })
  .refine((v) => v.weights || v.buckets, {
    message: "Provide weights, buckets, or both",
  });

export async function GET() {
  const { response } = await ensurePermission("visa-risk.read");
  if (response) return response;
  const [weights, buckets] = await Promise.all([getWeights(), getBuckets()]);
  return ok({ weights, buckets });
}

export async function PUT(req: NextRequest) {
  const { response } = await ensurePermission("visa-risk.write");
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = weightsPutSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  const updates: { weights?: unknown; buckets?: unknown } = {};
  if (parsed.data.weights) updates.weights = await setWeights(parsed.data.weights);
  if (parsed.data.buckets) updates.buckets = await setBuckets(parsed.data.buckets);
  return ok(updates);
}
