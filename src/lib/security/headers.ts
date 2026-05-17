/**
 * Apply the per-request security headers that are too dynamic to live in
 * next.config.ts. Static, route-independent headers (X-Frame-Options,
 * Referrer-Policy, HSTS, etc.) are still emitted from next.config; this
 * helper layers the request-specific bits on top.
 */
import "server-only";
import type { NextResponse } from "next/server";
import { buildCsp, cspHeaderName } from "./csp";

export interface ApplyHeadersOptions {
  /** Per-request CSP nonce (also forwarded as `x-nonce` for SSR consumers). */
  nonce: string;
  /** Emit CSP as Report-Only (typically in dev / staging rollout). */
  cspReportOnly?: boolean;
}

export function applyDynamicSecurityHeaders(res: NextResponse, opts: ApplyHeadersOptions) {
  const csp = buildCsp({ nonce: opts.nonce });
  res.headers.set(cspHeaderName(opts.cspReportOnly ?? false), csp);
  res.headers.set("x-nonce", opts.nonce);
  return res;
}
