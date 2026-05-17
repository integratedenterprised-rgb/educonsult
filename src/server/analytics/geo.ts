/**
 * Light-weight device + country detection from request headers.
 *
 * We intentionally avoid a heavy UA-parser dependency. The categories below
 * are coarse-grained (DESKTOP | TABLET | MOBILE | BOT) — enough for the
 * "% mobile traffic" tile on the dashboard. For granular UA breakdowns,
 * an admin can wire PostHog / Clarity via [[analytics-config]].
 *
 * GeoIP lookup uses the standard hosting platform headers (Vercel, Cloudflare,
 * fly.io) in order. Where none are present we return null and the dashboard
 * row groups under "Unknown".
 */
import "server-only";
import { createHash } from "node:crypto";

export type Device = "DESKTOP" | "TABLET" | "MOBILE" | "BOT" | "UNKNOWN";

const BOT_REGEX = /bot|crawler|spider|crawling|facebookexternalhit|preview|lighthouse|headlesschrome/i;
const TABLET_REGEX = /ipad|tablet|playbook|silk|kindle/i;
const MOBILE_REGEX = /mobile|iphone|ipod|android.+mobile|windows phone|blackberry/i;

export function detectDevice(userAgent: string | null | undefined): Device {
  if (!userAgent) return "UNKNOWN";
  if (BOT_REGEX.test(userAgent)) return "BOT";
  if (TABLET_REGEX.test(userAgent)) return "TABLET";
  if (MOBILE_REGEX.test(userAgent)) return "MOBILE";
  return "DESKTOP";
}

// Returns a coarse browser family, not a precise version string.
export function detectBrowser(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome\//i.test(userAgent)) return "Chrome";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return "Safari";
  return null;
}

export function detectOs(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  if (/windows nt/i.test(userAgent)) return "Windows";
  if (/mac os x/i.test(userAgent)) return "macOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return null;
}

export interface RequestGeo {
  countryCode: string | null;
  region: string | null;
  city: string | null;
  ip: string | null;
}

export function detectGeo(headers: Headers): RequestGeo {
  const get = (k: string) => headers.get(k) || null;
  const countryCode =
    get("x-vercel-ip-country") ||
    get("cf-ipcountry") ||
    get("x-country-code") ||
    null;
  const region =
    get("x-vercel-ip-country-region") || get("cf-ipregion") || null;
  const city = get("x-vercel-ip-city") || get("cf-ipcity") || null;
  const xff = get("x-forwarded-for");
  const ip = xff ? xff.split(",")[0]!.trim() : get("x-real-ip") || null;
  return {
    countryCode: countryCode ? decodeURIComponent(countryCode).toUpperCase() : null,
    region: region ? decodeURIComponent(region) : null,
    city: city ? decodeURIComponent(city) : null,
    ip,
  };
}

/**
 * Hash an IP with a rotatable salt. We store this rather than the raw IP so a
 * cookie-less visitor cannot be re-identified across salt rotations.
 */
export function hashIp(ip: string | null, salt: string | null | undefined): string | null {
  if (!ip || !salt) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
