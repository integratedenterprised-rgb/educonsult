/**
 * Content-Security-Policy builder.
 *
 * Emitted from middleware so the nonce is unique per request. Next.js inlines
 * hydration scripts/styles, so a script nonce is required — we generate one
 * here and pass it through `x-nonce` request header → server components read
 * it via `headers().get("x-nonce")` and stamp it onto `<Script nonce>` / any
 * inline tag.
 *
 * Heatmap / analytics third parties are admin-configurable. Rather than
 * baking every vendor's origin into the policy, we keep the default strict
 * and allow operators to widen via `CSP_EXTRA_*` envs. The extra-allowed
 * origins are merged in at request time.
 *
 * Production toggles `Content-Security-Policy`; non-production toggles
 * `Content-Security-Policy-Report-Only` so the dev server is usable while
 * you iterate.
 */
import "server-only";
import { clientEnv } from "@/lib/env";

function envList(name: string): string[] {
  const v = process.env[name];
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

/** 16 random bytes, base64. Mounted per-request on `<Script nonce>`. */
export function generateNonce(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  // Browser-safe base64: middleware runs on the edge runtime where Buffer
  // is unavailable. Use btoa over a binary string.
  let bin = "";
  for (let i = 0; i < buf.length; i += 1) bin += String.fromCharCode(buf[i]!);
  return btoa(bin);
}

export interface CspOptions {
  nonce: string;
  /** Set true to emit in Report-Only mode (development / staging rollout). */
  reportOnly?: boolean;
}

export function buildCsp({ nonce }: CspOptions): string {
  const site = (() => {
    try { return new URL(clientEnv.NEXT_PUBLIC_SITE_URL).origin; } catch { return "'self'"; }
  })();

  const extraScript = envList("CSP_EXTRA_SCRIPT_SRC");
  const extraConnect = envList("CSP_EXTRA_CONNECT_SRC");
  const extraImg = envList("CSP_EXTRA_IMG_SRC");
  const extraFrame = envList("CSP_EXTRA_FRAME_SRC");
  const extraStyle = envList("CSP_EXTRA_STYLE_SRC");
  const reportUri = process.env.CSP_REPORT_URI;

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // `strict-dynamic` lets nonce'd scripts load further trusted scripts
    // without enumerating every CDN. In old browsers it falls back to the
    // listed host sources, hence keeping 'self' + extras.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // Next.js dev tooling + production runtime need eval in dev only.
      ...(process.env.NODE_ENV === "production" ? [] : ["'unsafe-eval'"]),
      ...extraScript,
    ],
    // Framer Motion + ShadCN write inline styles; Tailwind compiles to
    // classes (no inline). 'unsafe-inline' is unavoidable here; we mitigate
    // by keeping script-src nonce'd so an XSS payload can't smuggle <script>.
    "style-src": ["'self'", "'unsafe-inline'", ...extraStyle],
    "img-src": ["'self'", "data:", "blob:", "https:", ...extraImg],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", site, ...extraConnect],
    "frame-src": ["'self'", ...extraFrame],
    "media-src": ["'self'", "blob:", "data:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  if (reportUri) {
    directives["report-uri"] = [reportUri];
    directives["report-to"] = ["csp"];
  }

  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}

export function cspHeaderName(reportOnly: boolean): string {
  return reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
}
