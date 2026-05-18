/**
 * Public analytics ingestion.
 *
 * The browser SDK posts a batch of events here — either on `pagehide` via
 * `navigator.sendBeacon` or periodically while the page is open. The endpoint
 * is intentionally lenient: it never throws back at the SDK because losing a
 * page-view event must never break the user's session.
 *
 * Rate-limiting is at the gateway layer; we do a coarse "max 50 events per
 * batch" check via the zod schema. DNT and bot UAs are dropped inside
 * `ingestBatch()`.
 */
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { ApiErrors, ok } from "@/server/api/response";
import { eventBatchSchema } from "@/lib/analytics/types";
import { ingestBatch } from "@/server/analytics/events.service";
import {
  checkRateLimit,
  rateLimitHeaders,
  RateLimitPolicy,
  getClientIp,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // High-volume endpoint; the limit is loose but caps abusive clients. We
  // intentionally don't write an audit row per 429 — analytics ingest is
  // too noisy to justify a row per blocked beacon.
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit({
    key: `analytics:events:ip:${ip}`,
    ...RateLimitPolicy.analyticsIngest,
  });
  if (!rl.ok) {
    const res = NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
    for (const [k, v] of Object.entries(rateLimitHeaders(rl))) res.headers.set(k, v);
    return res;
  }

  let raw: unknown;
  try {
    // sendBeacon posts as text — try JSON, then fall back to text.
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      raw = await req.json();
    } else {
      const text = await req.text();
      raw = text ? JSON.parse(text) : null;
    }
  } catch {
    return ApiErrors.badRequest("Invalid body");
  }

  const parsed = eventBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return ApiErrors.badRequest("Invalid batch", parsed.error.flatten());
  }

  try {
    const result = await ingestBatch(parsed.data, {
      headers: req.headers,
      userAgent: req.headers.get("user-agent"),
      locale: req.headers.get("accept-language")?.split(",")[0] ?? null,
    });
    const res = ok(result);
    for (const [k, v] of Object.entries(rateLimitHeaders(rl))) res.headers.set(k, v);
    return res;
  } catch (e) {
    console.error("analytics ingest failed", e);
    // Still 200 — we don't want the SDK to retry a poison batch indefinitely.
    return ok({ written: 0 });
  }
}
