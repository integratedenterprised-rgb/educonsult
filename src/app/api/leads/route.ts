/**
 * Public lead intake endpoint.
 *
 * Single entry point for every form on the public site. The body must include
 * a `source` discriminator: ELIGIBILITY_FORM, VISA_RISK_FORM,
 * CONSULTATION_FORM, or RESOURCE_DOWNLOAD.
 *
 * Returns { leadId, isDuplicate, score, temperature, priority } so the form
 * client can show a tailored success message without an extra round trip.
 *
 * Defenses, in order:
 *  - IP rate limit (RateLimitPolicy.leadIntake) — blocks form-spam bursts.
 *  - CSRF/origin — enforced by middleware; the form must originate on our site.
 *  - Zod parse — the schema is the contract.
 *  - Recursive text sanitization on the payload — neutralizes any accidental
 *    HTML in free-text fields before it lands in the DB.
 */
import { NextRequest, NextResponse } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { parsePublicLead } from "@/lib/validators/lead";
import { submitPublicLead } from "@/server/leads/intake";
import { COOKIE_ANON, COOKIE_SESSION } from "@/lib/analytics/types";
import {
  checkRateLimit,
  rateLimitHeaders,
  RateLimitPolicy,
  getClientIp,
  sanitizeJsonText,
} from "@/lib/security";
import { logAudit } from "@/server/audit/audit";

export const runtime = "nodejs"; // we use Prisma + nodemailer
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const userAgent = req.headers.get("user-agent");

  const rl = await checkRateLimit({
    key: `leads:ip:${ip}`,
    ...RateLimitPolicy.leadIntake,
  });
  if (!rl.ok) {
    await logAudit({
      action: "RATE_LIMITED",
      status: "FAILURE",
      entity: "lead",
      ipAddress: ip,
      userAgent,
      metadata: { route: "/api/leads" },
    });
    const res = NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
    for (const [k, v] of Object.entries(rateLimitHeaders(rl))) res.headers.set(k, v);
    return res;
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return ApiErrors.badRequest("Invalid JSON body");
  }

  const parsed = parsePublicLead(raw);
  if (!parsed.ok) {
    return ApiErrors.badRequest("Invalid input", parsed.error.flatten());
  }

  // Defense in depth: strip any HTML from free-text leaves. The schema
  // already validates structure; this neutralizes payloads disguised as
  // valid strings (e.g. <script> inside a "message" field).
  const sanitized = sanitizeJsonText(parsed.data);

  try {
    const result = await submitPublicLead(sanitized, {
      ipAddress: ip === "unknown" ? null : ip,
      userAgent,
      anonId: req.cookies.get(COOKIE_ANON)?.value ?? null,
      sessionId: req.cookies.get(COOKIE_SESSION)?.value ?? null,
    });
    const res = ok(result);
    for (const [k, v] of Object.entries(rateLimitHeaders(rl))) res.headers.set(k, v);
    return res;
  } catch (e) {
    console.error("submitPublicLead failed", e);
    return ApiErrors.serverError();
  }
}
