/**
 * `withApi()` — composable wrapper that bakes the standard guards into a
 * single call. Replaces the manual try/parse/permGuard pattern repeated in
 * dozens of route files.
 *
 * Layers, in order (any rejection short-circuits and writes an audit row):
 *   1. Rate limit         — keyed by IP, optional policy override.
 *   2. CSRF / origin      — enforced on non-safe methods.
 *   3. Body parse         — JSON only; rejects on syntax error.
 *   4. Zod validation     — body and/or query, results merged into `input`.
 *   5. Permission check   — via `requirePermission()`, attaches `user`.
 *
 * The handler receives a typed context. It is free to throw — uncaught
 * errors are converted to `SERVER_ERROR`, audited, and never leak the stack
 * to the client.
 */
import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z, type ZodSchema } from "zod";
import { ApiErrors, ok } from "./response";
import {
  checkRateLimit,
  rateLimitHeaders,
  RateLimitPolicy,
  type RateLimitPolicyName,
} from "@/lib/security/rate-limit";
import { checkCsrf, isSafeMethod } from "@/lib/security/csrf";
import { getClientIp } from "@/lib/security/ip";
import { getSession, type SessionUser } from "@/server/auth/session";
import { hasPermission, type Permission } from "@/server/auth/permissions";
import { logAudit } from "@/server/audit/audit";

export interface ApiContext<TInput> {
  req: NextRequest;
  input: TInput;
  user: SessionUser | null;
  ip: string;
  userAgent: string | null;
}

export interface WithApiOptions<
  TBody extends ZodSchema | undefined = undefined,
  TQuery extends ZodSchema | undefined = undefined,
> {
  /** Required permission. Omit for public endpoints. */
  permission?: Permission;
  /** Allow public access — same as omitting `permission`, but explicit. */
  public?: boolean;
  /** Zod schema for the JSON body. */
  body?: TBody;
  /** Zod schema for `URLSearchParams`. */
  query?: TQuery;
  /** Rate-limit policy. Omit to use `publicRead` (light) for GET and `adminWrite` for others. */
  rateLimit?: RateLimitPolicyName | { limit: number; windowMs: number };
  /** Override the auto-derived rate-limit key suffix (default: route + ip). */
  rateLimitKey?: (req: NextRequest, ip: string) => string;
  /** Skip the CSRF/origin check (use only for endpoints called from non-browser clients). */
  skipCsrf?: boolean;
  /** Audit entity name — e.g. `"page"`, `"lead"`. Audit row written on writes. */
  auditEntity?: string;
  /** Extract the entity ID for the audit row from the parsed input. */
  auditEntityId?: (input: unknown) => string | null | undefined;
}

type Infer<T extends ZodSchema | undefined> = T extends ZodSchema ? z.infer<T> : undefined;

type Handler<TBody extends ZodSchema | undefined, TQuery extends ZodSchema | undefined> = (
  ctx: ApiContext<{ body: Infer<TBody>; query: Infer<TQuery> }>,
) => Promise<Response | { data: unknown } | unknown>;

function resolvePolicy(
  rl: WithApiOptions["rateLimit"],
  method: string,
): { limit: number; windowMs: number } {
  if (typeof rl === "string") return RateLimitPolicy[rl];
  if (rl && typeof rl === "object") return rl;
  // Default: read endpoints get the relaxed `publicRead`, writes get `adminWrite`.
  return isSafeMethod(method) ? RateLimitPolicy.publicRead : RateLimitPolicy.adminWrite;
}

function auditAction(method: string): "CREATE" | "UPDATE" | "DELETE" | null {
  switch (method.toUpperCase()) {
    case "POST": return "CREATE";
    case "PUT":
    case "PATCH": return "UPDATE";
    case "DELETE": return "DELETE";
    default: return null;
  }
}

export function withApi<
  TBody extends ZodSchema | undefined = undefined,
  TQuery extends ZodSchema | undefined = undefined,
>(
  opts: WithApiOptions<TBody, TQuery>,
  handler: Handler<TBody, TQuery>,
) {
  return async function route(req: NextRequest): Promise<Response> {
    const ip = getClientIp(req.headers);
    const userAgent = req.headers.get("user-agent");
    const route = new URL(req.url).pathname;

    // 1. Rate limit
    const policy = resolvePolicy(opts.rateLimit, req.method);
    const rlKey = opts.rateLimitKey?.(req, ip) ?? `${req.method}:${route}:${ip}`;
    const rl = await checkRateLimit({ key: rlKey, ...policy });
    if (!rl.ok) {
      await logAudit({
        action: "RATE_LIMITED",
        status: "FAILURE",
        entity: opts.auditEntity ?? null,
        ipAddress: ip,
        userAgent,
        metadata: { route, method: req.method, key: rlKey },
      });
      const res = NextResponse.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 },
      );
      for (const [k, v] of Object.entries(rateLimitHeaders(rl))) res.headers.set(k, v);
      return res;
    }

    // 2. CSRF / origin check
    if (!opts.skipCsrf && !isSafeMethod(req.method)) {
      const csrf = checkCsrf(req);
      if (!csrf.ok) {
        await logAudit({
          action: "CSRF_REJECTED",
          status: "FAILURE",
          entity: opts.auditEntity ?? null,
          ipAddress: ip,
          userAgent,
          metadata: { route, method: req.method, reason: csrf.reason, origin: csrf.origin },
        });
        return ApiErrors.forbidden();
      }
    }

    // 3. Body parse + 4. Zod validation (body + query)
    let parsedBody: unknown = undefined;
    if (opts.body) {
      if (req.method === "GET" || req.method === "HEAD") {
        return ApiErrors.badRequest("Body schema set on a body-less method");
      }
      let raw: unknown;
      try { raw = await req.json(); } catch { return ApiErrors.badRequest("Invalid JSON body"); }
      const result = opts.body.safeParse(raw);
      if (!result.success) return ApiErrors.badRequest("Invalid input", result.error.flatten());
      parsedBody = result.data;
    }

    let parsedQuery: unknown = undefined;
    if (opts.query) {
      const params = Object.fromEntries(new URL(req.url).searchParams);
      const result = opts.query.safeParse(params);
      if (!result.success) return ApiErrors.badRequest("Invalid query", result.error.flatten());
      parsedQuery = result.data;
    }

    // 5. Permission
    let user: SessionUser | null = null;
    const requirePerm = opts.permission;
    if (requirePerm) {
      user = await getSession();
      if (!user) return ApiErrors.unauthorized();
      if (!hasPermission(user.role, requirePerm)) {
        await logAudit({
          action: "PERMISSION_DENIED",
          status: "FAILURE",
          entity: opts.auditEntity ?? null,
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          ipAddress: ip,
          userAgent,
          metadata: { route, method: req.method, permission: requirePerm },
        });
        return ApiErrors.forbidden();
      }
    } else if (!opts.public && !isSafeMethod(req.method)) {
      // Defensive: a writable endpoint with no permission specified and no
      // explicit `public: true` is almost certainly a misconfiguration.
      console.warn(`[withApi] mutating route ${route} has no permission and no public flag`);
    }

    // Handler
    try {
      const out = await handler({
        req,
        input: { body: parsedBody as Infer<TBody>, query: parsedQuery as Infer<TQuery> },
        user,
        ip,
        userAgent,
      });

      let response: Response;
      if (out instanceof Response) {
        response = out;
      } else if (out && typeof out === "object" && "data" in (out as Record<string, unknown>)) {
        response = ok((out as { data: unknown }).data);
      } else {
        response = ok(out ?? null);
      }
      for (const [k, v] of Object.entries(rateLimitHeaders(rl))) response.headers.set(k, v);

      // Audit successful mutation if entity provided.
      const action = auditAction(req.method);
      if (action && opts.auditEntity) {
        await logAudit({
          action,
          entity: opts.auditEntity,
          entityId: opts.auditEntityId?.(parsedBody ?? parsedQuery) ?? null,
          actorId: user?.id ?? null,
          actorEmail: user?.email ?? null,
          actorRole: user?.role ?? null,
          ipAddress: ip,
          userAgent,
          metadata: { route },
        });
      }
      return response;
    } catch (err) {
      console.error(`[withApi] ${req.method} ${route} failed`, err);
      // Audit the failure for write paths so investigators see the trail.
      const action = auditAction(req.method);
      if (action && opts.auditEntity) {
        await logAudit({
          action,
          status: "FAILURE",
          entity: opts.auditEntity,
          actorId: user?.id ?? null,
          actorEmail: user?.email ?? null,
          actorRole: user?.role ?? null,
          ipAddress: ip,
          userAgent,
          metadata: { route, error: err instanceof Error ? err.message : String(err) },
        });
      }
      return ApiErrors.serverError();
    }
  };
}
