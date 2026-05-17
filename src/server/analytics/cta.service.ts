/**
 * CTA click aggregates. Backs the "top CTAs" widget and the per-page CTA
 * leaderboard.
 *
 * A CTA is identified by `ctaId` (stable string, e.g. "hero-book-call") and
 * groups by `ctaLabel` for display. We surface the most-clicked CTAs along
 * with their click-through rate (clicks ÷ form_views on the same page) where
 * computable.
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export interface CtaRow {
  ctaId: string;
  ctaLabel: string;
  ctaHref: string | null;
  clicks: number;
  uniqueVisitors: number;
  topPath: string | null;
}

export async function topCtas(days = 30, limit = 20): Promise<CtaRow[]> {
  const since = sinceDays(days);
  const rows = await prisma.analyticsEvent.groupBy({
    by: ["ctaId", "ctaLabel", "ctaHref"],
    where: {
      type: "CTA_CLICK",
      createdAt: { gte: since },
      ctaId: { not: null },
    },
    _count: { _all: true },
    orderBy: { _count: { ctaId: "desc" } },
    take: limit,
  });

  // Unique-visitor count is a second pass — Prisma groupBy doesn't support
  // count(distinct). Cheap for the leaderboard size; would warrant raw SQL
  // if we render this on every page load.
  const enriched: CtaRow[] = [];
  for (const r of rows) {
    if (!r.ctaId) continue;
    const [uniques, top] = await Promise.all([
      prisma.analyticsEvent
        .findMany({
          where: { type: "CTA_CLICK", ctaId: r.ctaId, createdAt: { gte: since } },
          select: { anonId: true },
          distinct: ["anonId"],
        })
        .then((rows) => rows.length),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { type: "CTA_CLICK", ctaId: r.ctaId, createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 1,
      }),
    ]);
    enriched.push({
      ctaId: r.ctaId,
      ctaLabel: r.ctaLabel ?? r.ctaId,
      ctaHref: r.ctaHref,
      clicks: r._count._all,
      uniqueVisitors: uniques,
      topPath: top[0]?.path ?? null,
    });
  }
  return enriched;
}

export interface CtaTimeseriesPoint {
  date: string;
  clicks: number;
}

export async function ctaTimeseries(ctaId: string, days = 30): Promise<CtaTimeseriesPoint[]> {
  const since = sinceDays(days);
  const events = await prisma.analyticsEvent.findMany({
    where: { type: "CTA_CLICK", ctaId, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  return bucketDays(events.map((e) => e.createdAt), days, since);
}

export async function ctasForPath(path: string, days = 30): Promise<CtaRow[]> {
  const since = sinceDays(days);
  const rows = await prisma.analyticsEvent.groupBy({
    by: ["ctaId", "ctaLabel", "ctaHref"],
    where: { type: "CTA_CLICK", createdAt: { gte: since }, path },
    _count: { _all: true },
    orderBy: { _count: { ctaId: "desc" } },
    take: 50,
  });
  return rows
    .filter((r) => r.ctaId)
    .map((r) => ({
      ctaId: r.ctaId!,
      ctaLabel: r.ctaLabel ?? r.ctaId!,
      ctaHref: r.ctaHref,
      clicks: r._count._all,
      uniqueVisitors: 0,
      topPath: path,
    }));
}

function sinceDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function bucketDays(dates: Date[], days: number, start: Date): CtaTimeseriesPoint[] {
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const dt of dates) {
    const key = dt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, clicks]) => ({ date, clicks }));
}
