/**
 * Funnel analytics.
 *
 * A funnel is an ordered list of `AnalyticsEventType`s with optional Json
 * filters (e.g. `{ formId: "abc" }`). For each entrant of step 0 we count
 * how many also hit the subsequent steps in order within `windowHours`.
 *
 * Two query modes:
 *  - `computeFunnel()` — fresh, accurate, scans the event table. Cheap for
 *    short windows; admin "live view" uses this.
 *  - `getFunnelRollupRange()` — reads pre-computed `FunnelDailyRollup` rows.
 *    Used on the dashboard cards; backfilled by `rollupYesterday()`.
 *
 * The seed file inserts four default funnels (consultation, eligibility,
 * visa risk, resource download). Admins can edit/disable, not delete the
 * built-ins (enforced in the admin service, not here).
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { AnalyticsEventType, FunnelDefinition, Prisma } from "@prisma/client";

export interface FunnelStep {
  name: string;
  eventType: AnalyticsEventType;
  filter?: Record<string, unknown>;
}

export interface FunnelStepResult {
  step: number;
  name: string;
  entrants: number;
  // % of step-0 entrants who reached this step.
  conversion: number;
  // % of *previous* step's entrants who reached this step.
  stepConversion: number;
}

export interface FunnelResult {
  funnelId: string;
  slug: string;
  name: string;
  windowHours: number;
  rangeStart: string;
  rangeEnd: string;
  totalEntrants: number;
  overallConversion: number;
  steps: FunnelStepResult[];
}

export function parseSteps(raw: Prisma.JsonValue | null | undefined): FunnelStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => (typeof s === "object" && s ? (s as Record<string, unknown>) : null))
    .filter(Boolean)
    .map((s) => ({
      name: String(s!.name ?? ""),
      eventType: s!.eventType as AnalyticsEventType,
      filter: (s!.filter ?? undefined) as Record<string, unknown> | undefined,
    }))
    .filter((s) => Boolean(s.eventType));
}

export async function listFunnels(): Promise<FunnelDefinition[]> {
  return prisma.funnelDefinition.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getFunnelBySlug(slug: string): Promise<FunnelDefinition | null> {
  return prisma.funnelDefinition.findUnique({ where: { slug } });
}

interface ComputeOptions {
  rangeStart: Date;
  rangeEnd: Date;
}

/**
 * Compute a funnel over a date range. Algorithm:
 *  1. Pull all (anonId, type, createdAt, properties) rows in range matching
 *     ANY of the step event types (cheap thanks to the (type, createdAt)
 *     index).
 *  2. Group by anonId, sort by createdAt.
 *  3. For each visitor, walk steps in order. If they hit step N, they're
 *     a candidate for step N+1 within windowHours.
 *
 * This is O(events_in_range). For high traffic, swap to a SQL window-function
 * approach — the call signature won't change.
 */
export async function computeFunnel(
  funnel: FunnelDefinition,
  { rangeStart, rangeEnd }: ComputeOptions,
): Promise<FunnelResult> {
  const steps = parseSteps(funnel.steps);
  if (steps.length === 0) {
    return emptyResult(funnel, rangeStart, rangeEnd);
  }

  const stepTypes = Array.from(new Set(steps.map((s) => s.eventType)));
  const events = await prisma.analyticsEvent.findMany({
    where: {
      type: { in: stepTypes },
      createdAt: { gte: rangeStart, lt: rangeEnd },
    },
    select: {
      anonId: true,
      type: true,
      createdAt: true,
      formId: true,
      pageId: true,
      blogPostId: true,
      countryId: true,
      resourceId: true,
      properties: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const byVisitor = new Map<string, typeof events>();
  for (const e of events) {
    const list = byVisitor.get(e.anonId);
    if (list) list.push(e);
    else byVisitor.set(e.anonId, [e]);
  }

  const stepEntrants = new Array<Set<string>>(steps.length);
  for (let i = 0; i < steps.length; i++) stepEntrants[i] = new Set<string>();

  const windowMs = funnel.windowHours * 3_600_000;

  for (const [anonId, visitorEvents] of byVisitor) {
    let cursor = 0;
    let stepZeroTime: number | null = null;
    for (const e of visitorEvents) {
      const step = steps[cursor]!;
      if (e.type !== step.eventType) continue;
      if (!matchesFilter(e, step.filter)) continue;

      if (cursor === 0) {
        stepEntrants[0]!.add(anonId);
        stepZeroTime = e.createdAt.getTime();
        cursor = 1;
        if (cursor >= steps.length) break;
        continue;
      }
      if (stepZeroTime && e.createdAt.getTime() - stepZeroTime > windowMs) break;
      stepEntrants[cursor]!.add(anonId);
      cursor += 1;
      if (cursor >= steps.length) break;
    }
  }

  const totalEntrants = stepEntrants[0]!.size;
  const finalEntrants = stepEntrants[steps.length - 1]!.size;
  const overallConversion = totalEntrants > 0 ? finalEntrants / totalEntrants : 0;

  const stepResults: FunnelStepResult[] = steps.map((s, i) => {
    const entrants = stepEntrants[i]!.size;
    const prev = i === 0 ? entrants : stepEntrants[i - 1]!.size;
    return {
      step: i,
      name: s.name,
      entrants,
      conversion: totalEntrants > 0 ? entrants / totalEntrants : 0,
      stepConversion: prev > 0 ? entrants / prev : 0,
    };
  });

  return {
    funnelId: funnel.id,
    slug: funnel.slug,
    name: funnel.name,
    windowHours: funnel.windowHours,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    totalEntrants,
    overallConversion,
    steps: stepResults,
  };
}

type EventRow = {
  formId: string | null;
  pageId: string | null;
  blogPostId: string | null;
  countryId: string | null;
  resourceId: string | null;
  properties: Prisma.JsonValue | null;
};

function matchesFilter(event: EventRow, filter: Record<string, unknown> | undefined): boolean {
  if (!filter) return true;
  for (const [key, want] of Object.entries(filter)) {
    if (key === "formId" && event.formId !== want) return false;
    if (key === "pageId" && event.pageId !== want) return false;
    if (key === "blogPostId" && event.blogPostId !== want) return false;
    if (key === "countryId" && event.countryId !== want) return false;
    if (key === "resourceId" && event.resourceId !== want) return false;
    if (key === "properties" && typeof want === "object" && want) {
      const got = event.properties && typeof event.properties === "object" ? (event.properties as Record<string, unknown>) : null;
      if (!got) return false;
      for (const [pk, pv] of Object.entries(want as Record<string, unknown>)) {
        if (got[pk] !== pv) return false;
      }
    }
  }
  return true;
}

function emptyResult(f: FunnelDefinition, start: Date, end: Date): FunnelResult {
  return {
    funnelId: f.id,
    slug: f.slug,
    name: f.name,
    windowHours: f.windowHours,
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
    totalEntrants: 0,
    overallConversion: 0,
    steps: [],
  };
}

// ----------------------------------------------------------------------------
// Rollups — run nightly. Reads previous day, writes one FunnelDailyRollup
// row per funnel.
// ----------------------------------------------------------------------------

export async function rollupYesterday(): Promise<{ funnels: number }> {
  const end = startOfUtcDay(new Date());
  const start = new Date(end.getTime() - 86_400_000);
  const funnels = await prisma.funnelDefinition.findMany({ where: { isActive: true } });

  for (const funnel of funnels) {
    const result = await computeFunnel(funnel, { rangeStart: start, rangeEnd: end });
    await prisma.funnelDailyRollup.upsert({
      where: { funnelId_date: { funnelId: funnel.id, date: start } },
      create: {
        funnelId: funnel.id,
        date: start,
        stepStats: result.steps as unknown as Prisma.InputJsonValue,
        entrants: result.totalEntrants,
        conversions: result.steps.length > 0 ? result.steps[result.steps.length - 1]!.entrants : 0,
      },
      update: {
        stepStats: result.steps as unknown as Prisma.InputJsonValue,
        entrants: result.totalEntrants,
        conversions: result.steps.length > 0 ? result.steps[result.steps.length - 1]!.entrants : 0,
      },
    });
  }
  return { funnels: funnels.length };
}

function startOfUtcDay(d: Date): Date {
  const out = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return out;
}

// ----------------------------------------------------------------------------
// CRUD for admin
// ----------------------------------------------------------------------------

export interface FunnelInput {
  slug: string;
  name: string;
  description?: string;
  steps: FunnelStep[];
  windowHours?: number;
  isActive?: boolean;
}

export async function createFunnel(input: FunnelInput): Promise<FunnelDefinition> {
  return prisma.funnelDefinition.create({
    data: {
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      steps: input.steps as unknown as Prisma.InputJsonValue,
      windowHours: input.windowHours ?? 168,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateFunnel(id: string, input: Partial<FunnelInput>): Promise<FunnelDefinition> {
  return prisma.funnelDefinition.update({
    where: { id },
    data: {
      slug: input.slug,
      name: input.name,
      description: input.description,
      steps: input.steps ? (input.steps as unknown as Prisma.InputJsonValue) : undefined,
      windowHours: input.windowHours,
      isActive: input.isActive,
    },
  });
}
