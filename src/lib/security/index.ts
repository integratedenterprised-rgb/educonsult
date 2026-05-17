/**
 * Public surface for `@/lib/security`. Importing from here keeps call sites
 * decoupled from the per-module filenames.
 */
export {
  checkRateLimit,
  rateLimitHeaders,
  RateLimitPolicy,
  type RateLimitPolicyName,
  type RateLimitResult,
} from "./rate-limit";
export {
  hashPassword,
  verifyPassword,
  verifyPasswordTimingSafe,
  passwordSchema,
  DUMMY_HASH,
} from "./password";
export {
  sanitizeRichHtml,
  sanitizeBasicHtml,
  sanitizeText,
  sanitizeJsonText,
  sanitizeSectionsHtml,
} from "./sanitize";
export { checkCsrf, isSafeMethod } from "./csrf";
export { buildCsp, cspHeaderName, generateNonce } from "./csp";
export { applyDynamicSecurityHeaders } from "./headers";
export { getClientIp } from "./ip";
