/**
 * CSRF protection — Origin/Referer enforcement for state-changing requests.
 *
 * Auth.js's session cookies are already SameSite=Lax (Strict for credentials),
 * which blocks the classic cross-site form post. This adds defense-in-depth:
 * any mutating request to our admin API must come from our own origin. The
 * check is cheap, has no state, and works for fetch() calls where Lax is
 * insufficient (cross-subdomain, embedded contexts).
 *
 * We trust the browser-controlled `Origin`/`Referer` headers because the
 * browser refuses to let JavaScript forge them. Server-to-server traffic
 * (e.g. NextAuth's email magic-link callback) is exempted via `safeMethod`
 * or an explicit allow-list.
 */
import "server-only";
import type { NextRequest } from "next/server";
import { clientEnv } from "@/lib/env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase());
}

/**
 * Allow-listed origins — the deployed site plus localhost (for `pnpm dev`).
 * Add additional values via `ALLOWED_ORIGINS` env (comma-separated) if you
 * front the site with a CDN under a different hostname.
 */
function allowedOrigins(): Set<string> {
  const out = new Set<string>();
  const site = clientEnv.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try { out.add(new URL(site).origin); } catch { /* env validation catches this */ }
  }
  if (process.env.NODE_ENV !== "production") {
    out.add("http://localhost:3000");
    out.add("http://127.0.0.1:3000");
  }
  const extra = process.env.ALLOWED_ORIGINS;
  if (extra) {
    for (const o of extra.split(",").map((s) => s.trim()).filter(Boolean)) {
      try { out.add(new URL(o).origin); } catch { /* ignore */ }
    }
  }
  return out;
}

export interface CsrfCheckResult {
  ok: boolean;
  reason?: "missing-origin" | "origin-mismatch";
  origin?: string;
}

export function checkCsrf(req: NextRequest | Request): CsrfCheckResult {
  if (isSafeMethod(req.method)) return { ok: true };

  const allowed = allowedOrigins();
  const origin = req.headers.get("origin");
  if (origin) {
    return allowed.has(origin)
      ? { ok: true, origin }
      : { ok: false, reason: "origin-mismatch", origin };
  }

  // Some user agents omit `Origin` on same-origin POSTs; fall back to Referer.
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      return allowed.has(refOrigin)
        ? { ok: true, origin: refOrigin }
        : { ok: false, reason: "origin-mismatch", origin: refOrigin };
    } catch {
      return { ok: false, reason: "origin-mismatch" };
    }
  }

  // Mutating request with neither Origin nor Referer is suspicious. Reject.
  return { ok: false, reason: "missing-origin" };
}
