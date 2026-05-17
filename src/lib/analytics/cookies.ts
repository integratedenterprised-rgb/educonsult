/**
 * First-party analytics cookies — browser side.
 *
 * The server issues real cookies in `/api/analytics/session`. This module is
 * the read-side: we look up anon/session IDs from `document.cookie` and fall
 * back to a server round-trip when missing.
 */
import { COOKIE_ANON, COOKIE_SESSION } from "./types";

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const c of document.cookie.split(/;\s*/)) {
    if (c.startsWith(prefix)) return decodeURIComponent(c.slice(prefix.length));
  }
  return null;
}

export function getAnonId(): string | null {
  return readCookie(COOKIE_ANON);
}

export function getSessionId(): string | null {
  return readCookie(COOKIE_SESSION);
}

export interface SessionIds {
  anonId: string;
  sessionId: string;
}

let inFlight: Promise<SessionIds | null> | null = null;

export async function ensureSessionIds(): Promise<SessionIds | null> {
  const anonId = getAnonId();
  const sessionId = getSessionId();
  if (anonId && sessionId) return { anonId, sessionId };
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch("/api/analytics/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        ok: boolean;
        data?: { anonId: string | null; sessionId: string | null };
      };
      if (!data?.data?.anonId || !data.data.sessionId) return null;
      return { anonId: data.data.anonId, sessionId: data.data.sessionId };
    } catch {
      return null;
    } finally {
      // Reset so a later call after expiry can refresh.
      setTimeout(() => {
        inFlight = null;
      }, 5_000);
    }
  })();

  return inFlight;
}
