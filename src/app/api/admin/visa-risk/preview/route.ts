/**
 * Admin "dry run" endpoint. Evaluates a sample profile against the persisted
 * rule set (or an optional draft rule overlay) so the editor can preview the
 * outcome without persisting.
 */
import type { NextRequest } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { applicantProfileSchema, predicateSchema, riskLevelSchema } from "@/lib/validators/visa-risk";
import { previewAssessment, previewWithDraft } from "@/server/visa-risk/admin.service";
import { ensurePermission } from "../_guard";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const previewSchema = z.object({
  profile: applicantProfileSchema,
  draft: z
    .object({
      key: z.string().min(3),
      riskLevel: riskLevelSchema,
      score: z.number().int().min(-50).max(100),
      condition: predicateSchema,
      category: z.string().optional(),
      label: z.string().optional(),
      message: z.string().optional(),
      guidance: z.string().optional().nullable(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const { response } = await ensurePermission("visa-risk.read");
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) return ApiErrors.badRequest("Invalid input", parsed.error.flatten());

  try {
    const result = parsed.data.draft
      ? await previewWithDraft(parsed.data.profile, parsed.data.draft)
      : await previewAssessment(parsed.data.profile);
    return ok(result);
  } catch (e) {
    console.error("previewAssessment failed", e);
    return ApiErrors.serverError();
  }
}
