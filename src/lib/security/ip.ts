/**
 * Resolve the client IP from request headers.
 *
 * Trust `X-Forwarded-For` only because we deploy behind a known proxy/CDN
 * (Vercel, Cloudflare, etc.). The first value in the list is the original
 * client; later values are added by intermediate hops. For self-hosted
 * deployments, set `TRUSTED_PROXY_HOPS` to the number of trusted hops if
 * you need to skip past hostile injections — defaults to 0 (take the head).
 */
import "server-only";

export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const hops = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    const trustedSkip = Number(process.env.TRUSTED_PROXY_HOPS ?? "0") || 0;
    const idx = Math.min(trustedSkip, Math.max(0, hops.length - 1));
    const candidate = hops[idx];
    if (candidate) return candidate;
  }
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "unknown";
}
