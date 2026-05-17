/**
 * Event ingestion + server-side emission.
 *
 * Two callers:
 *  1. `ingestBatch()` — the public `/api/analytics/events` endpoint. Accepts
 *     a validated batch from the browser SDK, attaches request-side context
 *     (geo, device, hashed IP), and writes events + updates the session
 *     aggregates in a single transaction.
 *
 *  2. `recordServerEvent()` — server code emitting a lifecycle event (lead
 *     created, lead won, etc.) without a browser context. These rows carry
 *     no anonId/sessionId of their own; instead they reuse the lead's most
 *     recent session for attribution, falling back to `system:{leadId}`.
 *
 * Writes are fire-and-forget from the caller's perspective; failures are
 * logged but never thrown back into the request lifecycle.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  AnalyticsDevice,
  AnalyticsEvent,
  AnalyticsEventType,
} from "@prisma/client";
import type { EventBatch, EventInput } from "@/lib/analytics/types";
import {
  detectBrowser,
  detectDevice,
  detectGeo,
  detectOs,
  hashIp,
  type RequestGeo,
} from "./geo";
import { getAnalyticsConfig } from "./config.service";

export interface IngestContext {
  headers: Headers;
  geo?: RequestGeo;
  userAgent?: string | null;
  locale?: string | null;
}

/**
 * Ingest a batch of browser-collected events. Never throws — returns the
 * count written so the route can echo it back for client-side logging.
 */
export async function ingestBatch(
  batch: EventBatch,
  ctx: IngestContext,
): Promise<{ written: number }> {
  const config = await getAnalyticsConfig();
  if (config.respectDoNotTrack && ctx.headers.get("dnt") === "1") {
    return { written: 0 };
  }

  const geo = ctx.geo ?? detectGeo(ctx.headers);
  const ua = ctx.userAgent ?? ctx.headers.get("user-agent");
  const device = detectDevice(ua);
  if (device === "BOT") return { written: 0 };

  const browser = detectBrowser(ua);
  const os = detectOs(ua);
  const ipHash = hashIp(geo.ip, config.ipHashSalt);
  const locale = ctx.locale ?? null;

  const rows: Prisma.AnalyticsEventCreateManyInput[] = batch.events.map((e) =>
    toRow(e, {
      anonId: batch.anonId,
      sessionId: batch.sessionId,
      device,
      browser,
      os,
      locale,
      geo,
      ipHash,
    }),
  );

  await prisma.$transaction([
    prisma.analyticsEvent.createMany({ data: rows, skipDuplicates: true }),
    // Bump the session aggregates. We upsert because the first event of a
    // new visitor's session also creates the AnalyticsSession row.
    ...upsertSessionStatements(batch, ctx, geo, device, browser, os, locale),
  ]);

  return { written: rows.length };
}

interface RowCtx {
  anonId: string;
  sessionId: string;
  device: AnalyticsDevice;
  browser: string | null;
  os: string | null;
  locale: string | null;
  geo: RequestGeo;
  ipHash: string | null;
}

function toRow(e: EventInput, ctx: RowCtx): Prisma.AnalyticsEventCreateManyInput {
  return {
    type: e.type as AnalyticsEventType,
    name: e.name ?? null,
    anonId: ctx.anonId,
    sessionId: ctx.sessionId,
    path: e.path,
    referrer: e.referrer ?? null,
    pageId: e.pageId ?? null,
    blogPostId: e.blogPostId ?? null,
    countryId: e.countryId ?? null,
    courseId: e.courseId ?? null,
    resourceId: e.resourceId ?? null,
    formId: e.formId ?? null,
    ctaId: e.ctaId ?? null,
    ctaLabel: e.ctaLabel ?? null,
    ctaHref: e.ctaHref ?? null,
    fieldName: e.fieldName ?? null,
    formStep: e.formStep ?? null,
    errorMessage: e.errorMessage ?? null,
    properties: e.properties ? (e.properties as Prisma.InputJsonValue) : Prisma.JsonNull,
    value: e.value ?? null,
    utmSource: e.utmSource ?? null,
    utmMedium: e.utmMedium ?? null,
    utmCampaign: e.utmCampaign ?? null,
    utmTerm: e.utmTerm ?? null,
    utmContent: e.utmContent ?? null,
    countryCode: ctx.geo.countryCode,
    region: ctx.geo.region,
    city: ctx.geo.city,
    device: ctx.device,
    browser: ctx.browser,
    os: ctx.os,
    locale: ctx.locale,
    ipHash: ctx.ipHash,
    createdAt: e.ts ? new Date(e.ts) : undefined,
  };
}

function upsertSessionStatements(
  batch: EventBatch,
  _ctx: IngestContext,
  geo: RequestGeo,
  device: AnalyticsDevice,
  browser: string | null,
  os: string | null,
  locale: string | null,
): Prisma.PrismaPromise<unknown>[] {
  // First event of the batch dictates the landing/attribution snapshot.
  const first = batch.events[0]!;
  const pageViews = batch.events.filter((e) => e.type === "PAGE_VIEW").length;

  return [
    prisma.analyticsSession.upsert({
      where: { id: batch.sessionId },
      create: {
        id: batch.sessionId,
        anonId: batch.anonId,
        landingPath: first.path,
        referrer: first.referrer ?? null,
        utmSource: first.utmSource ?? null,
        utmMedium: first.utmMedium ?? null,
        utmCampaign: first.utmCampaign ?? null,
        utmTerm: first.utmTerm ?? null,
        utmContent: first.utmContent ?? null,
        device,
        browser,
        os,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
        locale,
        pageViews,
        eventCount: batch.events.length,
      },
      update: {
        lastSeenAt: new Date(),
        pageViews: { increment: pageViews },
        eventCount: { increment: batch.events.length },
      },
    }),
  ];
}

// ----------------------------------------------------------------------------
// Server-side lifecycle events
// ----------------------------------------------------------------------------

export interface ServerEventInput {
  type: AnalyticsEventType;
  leadId?: string | null;
  userId?: string | null;
  path?: string;
  properties?: Record<string, unknown>;
  value?: number;
  // Optional override — if the caller knows the session associated with the
  // lead. When omitted we look it up.
  sessionId?: string;
  anonId?: string;
}

export async function recordServerEvent(
  input: ServerEventInput,
): Promise<AnalyticsEvent | null> {
  try {
    let sessionId = input.sessionId;
    let anonId = input.anonId;
    if ((!sessionId || !anonId) && input.leadId) {
      const session = await prisma.analyticsSession.findFirst({
        where: { leadId: input.leadId },
        orderBy: { lastSeenAt: "desc" },
      });
      if (session) {
        sessionId = session.id;
        anonId = session.anonId;
      }
    }
    return await prisma.analyticsEvent.create({
      data: {
        type: input.type,
        anonId: anonId ?? `system:${input.leadId ?? input.userId ?? "internal"}`,
        sessionId: sessionId ?? `system:${input.leadId ?? input.userId ?? "internal"}`,
        userId: input.userId ?? null,
        leadId: input.leadId ?? null,
        path: input.path ?? "/system",
        properties: input.properties ? (input.properties as Prisma.InputJsonValue) : Prisma.JsonNull,
        value: input.value ?? null,
      },
    });
  } catch (err) {
    // Lifecycle events must never block the caller. Log and continue.
    console.error("[analytics] recordServerEvent failed", err);
    return null;
  }
}

/**
 * Attach a (so far anonymous) session to a freshly-created lead. Called from
 * lead intake — sets `AnalyticsSession.leadId` on the most recent session for
 * the visitor so later attribution queries don't have to walk events.
 */
export async function attachSessionToLead(
  anonId: string | null | undefined,
  sessionId: string | null | undefined,
  leadId: string,
): Promise<void> {
  if (!anonId && !sessionId) return;
  try {
    if (sessionId) {
      await prisma.analyticsSession.updateMany({
        where: { id: sessionId },
        data: { leadId },
      });
    }
    if (anonId) {
      // Backfill: any prior sessions from this visitor that weren't yet
      // tied to a lead get this lead pinned. This makes "first touch by
      // converting visitor" queries cheap.
      await prisma.analyticsSession.updateMany({
        where: { anonId, leadId: null },
        data: { leadId },
      });
      await prisma.analyticsEvent.updateMany({
        where: { anonId, leadId: null },
        data: { leadId },
      });
    }
  } catch (err) {
    console.error("[analytics] attachSessionToLead failed", err);
  }
}
