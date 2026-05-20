import { NextResponse, type NextRequest } from "next/server";
import { generateNonce, buildCsp, cspHeaderName } from "@/lib/security/csp";
import { checkCsrf, isSafeMethod } from "@/lib/security/csrf";

/**
 * Edge-runtime middleware. Three responsibilities:
 *
 *  1. Admin gate — cookie-presence redirect to /login. Full JWT validation
 *     happens inside `(admin)/layout.tsx` and `requirePermission()` (edge
 *     can't run the full Auth.js config). This matches Auth.js's recommended
 *     two-layer pattern.
 *  2. CSP — generate a fresh nonce per request, stamp it onto the request
 *     headers (so server components can read it via `headers()`), and emit
 *     the policy header on the response.
 *  3. CSRF / origin — reject mutating requests with a bad/absent Origin on
 *     admin API paths. `withApi()` re-checks this defensively, but blocking
 *     in middleware gives us a single chokepoint for routes that haven't
 *     migrated to the wrapper yet.
 *
 *  Note: this file runs on the edge runtime. No Prisma, no Node APIs, no
 *  audit writes here — those happen inside the node-runtime routes.
 */
const AUTH_COOKIE = process.env.NODE_ENV === "production"
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

// CSP is enforced in production, report-only in dev so HMR / eval keep
// working. For per-request nonces to reach the framework's injected scripts
// the page must be rendered per-request — see `dynamic = "force-dynamic"`
// in `app/layout.tsx`.
const CSP_REPORT_ONLY = process.env.NODE_ENV !== "production";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isApiPath = pathname.startsWith("/api/");

  // 1. Admin cookie gate — redirect HTML navigations to /login; reject API
  //    requests with 401 (don't redirect API clients).
  if (isAdminPath) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 2. CSRF/origin gate for admin mutations. Auth.js's own `/api/auth/*`
  //    endpoints have their own CSRF token; exempt them.
  if (isApiPath && !isSafeMethod(req.method) && !pathname.startsWith("/api/auth/")) {
    const csrf = checkCsrf(req);
    if (!csrf.ok) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: { code: "FORBIDDEN", message: "Bad origin" } }),
        { status: 403, headers: { "content-type": "application/json" } },
      );
    }
  }

  // 3. CSP + nonce — applied to every non-static path. The nonce travels
  //    through request headers so server components can attach it to inline
  //    <Script> tags. Next.js's render pipeline parses the CSP from REQUEST
  //    headers to discover the nonce for framework-injected scripts; without
  //    it, Next generates its own nonce and the response CSP won't match,
  //    breaking strict-dynamic.
  const nonce = generateNonce();
  const cspValue = !isApiPath ? buildCsp({ nonce }) : null;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  if (cspValue) requestHeaders.set(cspHeaderName(CSP_REPORT_ONLY), cspValue);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (cspValue) {
    res.headers.set(cspHeaderName(CSP_REPORT_ONLY), cspValue);
  }
  res.headers.set("x-nonce", nonce);
  // Belt-and-suspenders cross-origin isolation. next.config.ts emits these
  // statically too — middleware ensures they're present on every route
  // including those that bypass the static rules.
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");

  return res;
}

// Run on every path *except* Next's static asset routes and obvious public
// files. The matcher's negative lookahead is required — the simpler `/(.*)`
// would intercept image optimization output and slow it down.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|woff|woff2|ttf|otf)$).*)",
  ],
};
