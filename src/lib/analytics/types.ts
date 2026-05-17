/**
 * Analytics — shared types.
 *
 * Used by the browser SDK and the ingest API. Anything callable from a client
 * component must live in this file (no `server-only` import).
 */
import { z } from "zod";

export const ANALYTICS_EVENT_TYPES = [
  "PAGE_VIEW",
  "PAGE_LEAVE",
  "CTA_CLICK",
  "EXTERNAL_LINK_CLICK",
  "PHONE_CLICK",
  "EMAIL_CLICK",
  "WHATSAPP_CLICK",
  "SOCIAL_CLICK",
  "FORM_VIEW",
  "FORM_START",
  "FORM_FIELD_CHANGE",
  "FORM_FIELD_ERROR",
  "FORM_STEP_COMPLETE",
  "FORM_SUBMIT",
  "FORM_SUCCESS",
  "FORM_ERROR",
  "FORM_ABANDONED",
  "BLOG_VIEW",
  "BLOG_SCROLL_25",
  "BLOG_SCROLL_50",
  "BLOG_SCROLL_75",
  "BLOG_READ_COMPLETE",
  "COUNTRY_VIEW",
  "COURSE_VIEW",
  "RESOURCE_VIEW",
  "RESOURCE_DOWNLOAD",
  "SEARCH_QUERY",
  "SEARCH_RESULT_CLICK",
  "LEAD_CREATED",
  "LEAD_DEDUPLICATED",
  "LEAD_STAGE_CHANGED",
  "LEAD_STATUS_CHANGED",
  "LEAD_ASSIGNED",
  "LEAD_CONTACTED",
  "LEAD_WON",
  "LEAD_LOST",
  "CHAT_WIDGET_OPEN",
  "CHAT_WIDGET_MESSAGE",
  "CONSULTATION_BOOKED",
  "ELIGIBILITY_CHECKED",
  "VISA_RISK_CHECKED",
  "CUSTOM",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const COOKIE_ANON = "ec_aid";
export const COOKIE_SESSION = "ec_sid";
export const COOKIE_FIRST_TOUCH = "ec_ft";
// Session rotates after 30 minutes of idle.
export const SESSION_IDLE_MINUTES = 30;
// Anon cookie lasts 13 months (ITP cap).
export const ANON_COOKIE_DAYS = 395;

export const eventInputSchema = z.object({
  type: z.enum(ANALYTICS_EVENT_TYPES),
  name: z.string().max(80).optional(),
  // Required client-resolved context
  path: z.string().max(2048),
  referrer: z.string().max(2048).optional().nullable(),
  // Entity ids (cuid or short id; we don't validate cuid here — the FK
  // will reject anything unknown and we want server-emitted events to use
  // their own ids without coupling to a specific format).
  pageId: z.string().max(64).optional().nullable(),
  blogPostId: z.string().max(64).optional().nullable(),
  countryId: z.string().max(64).optional().nullable(),
  courseId: z.string().max(64).optional().nullable(),
  resourceId: z.string().max(64).optional().nullable(),
  formId: z.string().max(64).optional().nullable(),
  ctaId: z.string().max(80).optional().nullable(),
  ctaLabel: z.string().max(140).optional().nullable(),
  ctaHref: z.string().max(2048).optional().nullable(),
  fieldName: z.string().max(80).optional().nullable(),
  formStep: z.number().int().min(0).max(100).optional().nullable(),
  errorMessage: z.string().max(500).optional().nullable(),
  properties: z.record(z.unknown()).optional().nullable(),
  value: z.number().finite().optional().nullable(),
  // Attribution captured at event time (browser-known)
  utmSource: z.string().max(120).optional().nullable(),
  utmMedium: z.string().max(120).optional().nullable(),
  utmCampaign: z.string().max(120).optional().nullable(),
  utmTerm: z.string().max(120).optional().nullable(),
  utmContent: z.string().max(120).optional().nullable(),
  // Browser timestamp — server uses its own `now()` but we keep this for
  // out-of-order replay if needed.
  ts: z.number().int().positive().optional(),
});

export type EventInput = z.infer<typeof eventInputSchema>;

export const eventBatchSchema = z.object({
  anonId: z.string().min(8).max(64),
  sessionId: z.string().min(8).max(64),
  events: z.array(eventInputSchema).min(1).max(50),
});

export type EventBatch = z.infer<typeof eventBatchSchema>;
