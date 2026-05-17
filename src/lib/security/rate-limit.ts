/**
 * Rate limiting.
 *
 * Fixed-window counter in-process by default. The `RateLimitStore` interface
 * lets us swap in Redis/Upstash without touching call sites. We deliberately
 * avoid the token-bucket math here — fixed windows are easier to reason about
 * for abuse signals and the audit log, and the per-route windows we apply are
 * short enough that the burst-vs-sustained distinction does not matter.
 *
 * Keys: every caller chooses its own. A good key combines the route and a
 * stable client identity (IP + maybe email for login). NEVER key by anything
 * the caller can spoof without cost (e.g. plain User-Agent).
 *
 * Cleanup: a single lazy sweep on each `check()` call evicts entries whose
 * window has expired. That keeps memory bounded without a background timer
 * fighting Next.js's hot-reload lifecycle.
 */
import "server-only";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  /** Seconds until the window resets. Use for the `Retry-After` header. */
  retryAfterSec: number;
  /** Epoch ms when the window resets. Use for `X-RateLimit-Reset`. */
  resetAt: number;
}

export interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

class MemoryStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  async hit(key: string, windowMs: number) {
    const now = Date.now();
    // Lazy GC — cheap, bounded by the number of distinct keys per request.
    if (this.buckets.size > 5000) {
      for (const [k, v] of this.buckets) {
        if (v.resetAt <= now) this.buckets.delete(k);
      }
    }
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, fresh);
      return fresh;
    }
    existing.count += 1;
    return existing;
  }
}

// Process-wide singleton. Re-use across imports under `globalThis` so
// Next.js dev hot-reload doesn't reset the counters mid-request.
const globalForRateLimit = globalThis as unknown as { __rateLimitStore?: RateLimitStore };
const store: RateLimitStore = globalForRateLimit.__rateLimitStore ?? new MemoryStore();
if (!globalForRateLimit.__rateLimitStore) globalForRateLimit.__rateLimitStore = store;

export interface RateLimitOptions {
  /** Stable key — e.g. `login:ip:1.2.3.4` or `leads:ip:1.2.3.4`. */
  key: string;
  /** Max events allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;
  const { count, resetAt } = await store.hit(key, windowMs);
  const remaining = Math.max(0, limit - count);
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return {
    ok: count <= limit,
    remaining,
    limit,
    retryAfterSec,
    resetAt,
  };
}

/** Default policies used across the app. Tighten/loosen here in one place. */
export const RateLimitPolicy = {
  /** Login attempts per IP. Pair with the per-account lockout in auth.ts. */
  login: { limit: 10, windowMs: 60_000 },
  /** Public lead intake — abusive at scale; conservative limit. */
  leadIntake: { limit: 20, windowMs: 60_000 },
  /** Public analytics ingest — high volume but capped per IP. */
  analyticsIngest: { limit: 120, windowMs: 60_000 },
  /** Admin mutations — defends against compromised credentials. */
  adminWrite: { limit: 120, windowMs: 60_000 },
  /** Generic public read endpoints. */
  publicRead: { limit: 240, windowMs: 60_000 },
} as const;

export type RateLimitPolicyName = keyof typeof RateLimitPolicy;

/**
 * Apply standard `X-RateLimit-*` headers to a response. Always-on so clients
 * can back off proactively.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfterSec) }),
  };
}
