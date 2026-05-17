/**
 * Issue / refresh first-party analytics cookies.
 *
 * Called by the browser SDK on first load to ensure both cookies exist. We
 * never set these from a client component directly because we want them to
 * be HttpOnly-eligible (we keep them readable so the SDK can include the
 * IDs in event payloads — but they're flagged Secure + SameSite=Lax).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_ANON, COOKIE_SESSION, ANON_COOKIE_DAYS, SESSION_IDLE_MINUTES } from "@/lib/analytics/types";
import { getPublicAnalyticsConfig } from "@/server/analytics/config.service";
import {
  checkRateLimit,
  rateLimitHeaders,
  RateLimitPolicy,
  getClientIp,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function newId(prefix: string): string {
  // 22-char base36 — collision-resistant enough for our cardinality.
  const r = crypto.getRandomValues(new Uint8Array(16));
  return `${prefix}_${Buffer.from(r).toString("base64url").slice(0, 22)}`;
}

export async function POST(req: NextRequest) {
  // Cheap cap on per-IP session churn.
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit({
    key: `analytics:session:ip:${ip}`,
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

  const config = await getPublicAnalyticsConfig();
  if (config.respectDoNotTrack && req.headers.get("dnt") === "1") {
    return NextResponse.json({ ok: true, data: { anonId: null, sessionId: null } });
  }

  const cookieAnon = req.cookies.get(COOKIE_ANON)?.value;
  const cookieSession = req.cookies.get(COOKIE_SESSION)?.value;

  const anonId = cookieAnon ?? newId("a");
  const sessionId = cookieSession ?? newId("s");

  const res = NextResponse.json({ ok: true, data: { anonId, sessionId } });
  res.cookies.set(COOKIE_ANON, anonId, {
    httpOnly: false,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: ANON_COOKIE_DAYS * 86_400,
  });
  res.cookies.set(COOKIE_SESSION, sessionId, {
    httpOnly: false,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_IDLE_MINUTES * 60,
  });
  return res;
}
