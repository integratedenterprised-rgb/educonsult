/**
 * Browser analytics SDK.
 *
 * `track()` is the single API surface. Events are queued in memory, flushed
 * every `FLUSH_INTERVAL_MS` or on `visibilitychange`/`pagehide` via
 * `navigator.sendBeacon` so we never lose the last events of a session.
 *
 * Capabilities:
 *   - First-touch UTM capture (sessionStorage), re-attached to every event.
 *   - DNT check (mirrors the server-side check).
 *   - Consent gating — when `requireConsent` is true the SDK queues events
 *     until `grantConsent()` is called.
 *   - Tiny, dependency-free. Stays under 3kb gzipped.
 *
 * NOT used: third-party tags like GA4/Clarity. Those are injected separately
 * by `<HeatmapScript />` so this module remains the source of truth for our
 * first-party metrics.
 */
import { ANALYTICS_EVENT_TYPES, type AnalyticsEventType, type EventInput } from "./types";
import { ensureSessionIds } from "./cookies";

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH = 50;
const ENDPOINT = "/api/analytics/events";
const FIRST_TOUCH_KEY = "ec_first_touch";

interface SdkState {
  enabled: boolean;
  consented: boolean;
  requireConsent: boolean;
  queue: EventInput[];
  firstTouch: Partial<EventInput>;
  ids: { anonId: string; sessionId: string } | null;
  timer: ReturnType<typeof setTimeout> | null;
  bindUnload: boolean;
}

const state: SdkState = {
  enabled: typeof window !== "undefined",
  consented: true,
  requireConsent: false,
  queue: [],
  firstTouch: {},
  ids: null,
  timer: null,
  bindUnload: false,
};

interface InitOptions {
  requireConsent?: boolean;
  respectDoNotTrack?: boolean;
}

export function init(opts: InitOptions = {}): void {
  if (!state.enabled) return;
  if (opts.respectDoNotTrack && navigator.doNotTrack === "1") {
    state.enabled = false;
    return;
  }
  state.requireConsent = !!opts.requireConsent;
  state.consented = !state.requireConsent;
  captureFirstTouch();
  void ensureSessionIds().then((ids) => {
    state.ids = ids;
  });
  if (!state.bindUnload) {
    state.bindUnload = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushBeacon();
    });
    window.addEventListener("pagehide", () => flushBeacon());
  }
  scheduleFlush();
}

export function grantConsent(): void {
  if (!state.enabled) return;
  state.consented = true;
  scheduleFlush();
}

export function revokeConsent(): void {
  state.consented = false;
  state.queue.length = 0;
}

export function identify(_userId: string): void {
  // The first-party server resolves identity from cookies; the SDK doesn't
  // need to know the user id. Kept as a no-op so third-party tools (Clarity,
  // PostHog) that we may add later can use the same call site.
}

export interface TrackOptions {
  pageId?: string;
  blogPostId?: string;
  countryId?: string;
  courseId?: string;
  resourceId?: string;
  formId?: string;
  ctaId?: string;
  ctaLabel?: string;
  ctaHref?: string;
  fieldName?: string;
  formStep?: number;
  errorMessage?: string;
  properties?: Record<string, unknown>;
  value?: number;
  name?: string;
}

export function track(type: AnalyticsEventType, options: TrackOptions = {}): void {
  if (!state.enabled) return;
  if (!ANALYTICS_EVENT_TYPES.includes(type)) return;
  const ev: EventInput = {
    type,
    name: options.name,
    path: typeof location !== "undefined" ? location.pathname + location.search : "/",
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    pageId: options.pageId,
    blogPostId: options.blogPostId,
    countryId: options.countryId,
    courseId: options.courseId,
    resourceId: options.resourceId,
    formId: options.formId,
    ctaId: options.ctaId,
    ctaLabel: options.ctaLabel,
    ctaHref: options.ctaHref,
    fieldName: options.fieldName,
    formStep: options.formStep,
    errorMessage: options.errorMessage,
    properties: options.properties,
    value: options.value,
    utmSource: state.firstTouch.utmSource,
    utmMedium: state.firstTouch.utmMedium,
    utmCampaign: state.firstTouch.utmCampaign,
    utmTerm: state.firstTouch.utmTerm,
    utmContent: state.firstTouch.utmContent,
    ts: Date.now(),
  };
  state.queue.push(ev);
  if (state.queue.length >= MAX_BATCH) void flush();
  else scheduleFlush();
}

export function trackPageView(options: TrackOptions = {}): void {
  track("PAGE_VIEW", options);
}

export function trackCtaClick(options: TrackOptions & { ctaId: string }): void {
  track("CTA_CLICK", options);
}

function captureFirstTouch(): void {
  try {
    const stored = sessionStorage.getItem(FIRST_TOUCH_KEY);
    if (stored) {
      state.firstTouch = JSON.parse(stored);
      return;
    }
    const params = new URLSearchParams(location.search);
    const ft: Partial<EventInput> = {
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmTerm: params.get("utm_term") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
    };
    state.firstTouch = ft;
    sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(ft));
  } catch {
    // sessionStorage can throw in private mode — ignore.
  }
}

function scheduleFlush(): void {
  if (state.timer) return;
  state.timer = setTimeout(() => {
    state.timer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush(): Promise<void> {
  if (!state.consented) return;
  if (state.queue.length === 0) return;
  const ids = state.ids ?? (await ensureSessionIds());
  state.ids = ids;
  if (!ids) return;
  const events = state.queue.splice(0, MAX_BATCH);
  const payload = JSON.stringify({ anonId: ids.anonId, sessionId: ids.sessionId, events });
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {
    // Re-queue on transient failure (best-effort).
    state.queue.unshift(...events);
  }
}

function flushBeacon(): void {
  if (!state.consented) return;
  if (state.queue.length === 0) return;
  const ids = state.ids;
  if (!ids) return;
  const events = state.queue.splice(0, MAX_BATCH);
  const payload = JSON.stringify({ anonId: ids.anonId, sessionId: ids.sessionId, events });
  try {
    // sendBeacon is fire-and-forget — perfect for the unload path.
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(ENDPOINT, blob);
  } catch {
    // ignore
  }
}
