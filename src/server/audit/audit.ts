/**
 * Audit log writer.
 *
 * Single funnel for security/audit events. Callers describe what happened
 * (`action`), against what (`entity`/`entityId`), by whom (`actor*`), and
 * the request envelope (`ip`/`userAgent`). Anything extra goes in
 * `metadata` as JSON.
 *
 * Writes are best-effort: a failed audit insert must never break the
 * primary operation, so we catch and log. If the audit pipeline becomes
 * critical (compliance, SIEM forwarding), swap this for a queued writer.
 */
import "server-only";
import type { AuditAction, AuditStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/security/ip";
import { sanitizeText } from "@/lib/security/sanitize";

export interface AuditEntry {
  action: AuditAction;
  status?: AuditStatus;
  entity?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: UserRole | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        status: entry.status ?? "SUCCESS",
        entity: entry.entity ?? null,
        entityId: entry.entityId ?? null,
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ? entry.actorEmail.toLowerCase() : null,
        actorRole: entry.actorRole ?? null,
        // User-Agent strings are attacker-controlled and unbounded; sanitize
        // + cap. IPs are already short.
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ? sanitizeText(entry.userAgent).slice(0, 512) : null,
        metadata: (entry.metadata ?? null) as never,
      },
    });
  } catch (err) {
    // Never throw from the audit path; just emit a server log so ops can
    // alarm on it separately.
    console.error("[audit] failed to write audit log", err, { action: entry.action });
  }
}

/**
 * Convenience extractor — pull ip + user-agent from a fetch Request once and
 * pass the result alongside the typed audit fields.
 */
export function requestContext(req: Request | { headers: Headers }) {
  const headers = req.headers;
  return {
    ipAddress: getClientIp(headers),
    userAgent: headers.get("user-agent") ?? null,
  };
}
