/**
 * SEO performance — read + ingest helpers.
 *
 * Reads:
 *   - `seoOverview()` — totals + deltas for the dashboard tile.
 *   - `topPages()` / `topQueries()` — sorted leaderboards.
 *   - `seoTimeseries()` — daily clicks + impressions for the chart.
 *
 * Ingest:
 *   - `importGscRows()` — accepts an array of GSC export rows (CSV or API)
 *     and upserts into `SeoQueryDaily` + `SeoPageDaily` in one transaction.
 *     The page-level rollup is computed inline rather than as a second pass
 *     so the import is atomic.
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export interface SeoOverview {
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  clicksDeltaPct: number;
  impressionsDeltaPct: number;
  lastSyncAt: Date | null;
}

export async function seoOverview(days = 28): Promise<SeoOverview> {
  const end = startOfDay(new Date());
  const start = new Date(end.getTime() - days * 86_400_000);
  const prevStart = new Date(start.getTime() - days * 86_400_000);

  const [curr, prev, cfg] = await Promise.all([
    aggregate(start, end),
    aggregate(prevStart, start),
    prisma.analyticsConfig.findUnique({ where: { id: "singleton" }, select: { gscLastSyncAt: true } }),
  ]);

  return {
    clicks: curr.clicks,
    impressions: curr.impressions,
    ctr: curr.impressions > 0 ? curr.clicks / curr.impressions : 0,
    avgPosition: curr.avgPosition,
    clicksDeltaPct: pctDelta(curr.clicks, prev.clicks),
    impressionsDeltaPct: pctDelta(curr.impressions, prev.impressions),
    lastSyncAt: cfg?.gscLastSyncAt ?? null,
  };
}

async function aggregate(start: Date, end: Date) {
  const agg = await prisma.seoPageDaily.aggregate({
    where: { date: { gte: start, lt: end } },
    _sum: { clicks: true, impressions: true },
    _avg: { avgPosition: true },
  });
  return {
    clicks: agg._sum.clicks ?? 0,
    impressions: agg._sum.impressions ?? 0,
    avgPosition: agg._avg.avgPosition ?? 0,
  };
}

function pctDelta(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 1 : 0;
  return (curr - prev) / prev;
}

export interface SeoTimeseriesPoint {
  date: string;
  clicks: number;
  impressions: number;
}

export async function seoTimeseries(days = 28): Promise<SeoTimeseriesPoint[]> {
  const end = startOfDay(new Date());
  const start = new Date(end.getTime() - days * 86_400_000);
  const rows = await prisma.seoPageDaily.groupBy({
    by: ["date"],
    where: { date: { gte: start, lt: end } },
    _sum: { clicks: true, impressions: true },
    orderBy: { date: "asc" },
  });
  const map = new Map<string, SeoTimeseriesPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    map.set(d.toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), clicks: 0, impressions: 0 });
  }
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    map.set(key, {
      date: key,
      clicks: r._sum.clicks ?? 0,
      impressions: r._sum.impressions ?? 0,
    });
  }
  return Array.from(map.values());
}

export interface SeoPageRow {
  path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

export async function topPages(days = 28, limit = 20): Promise<SeoPageRow[]> {
  const end = startOfDay(new Date());
  const start = new Date(end.getTime() - days * 86_400_000);
  const rows = await prisma.seoPageDaily.groupBy({
    by: ["path"],
    where: { date: { gte: start, lt: end } },
    _sum: { clicks: true, impressions: true },
    _avg: { avgPosition: true },
    orderBy: { _sum: { clicks: "desc" } },
    take: limit,
  });
  return rows.map((r) => {
    const clicks = r._sum.clicks ?? 0;
    const impressions = r._sum.impressions ?? 0;
    return {
      path: r.path,
      clicks,
      impressions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      avgPosition: r._avg.avgPosition ?? 0,
    };
  });
}

export interface SeoQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

export async function topQueries(days = 28, limit = 20): Promise<SeoQueryRow[]> {
  const end = startOfDay(new Date());
  const start = new Date(end.getTime() - days * 86_400_000);
  const rows = await prisma.seoQueryDaily.groupBy({
    by: ["query"],
    where: { date: { gte: start, lt: end } },
    _sum: { clicks: true, impressions: true },
    _avg: { position: true },
    orderBy: { _sum: { clicks: "desc" } },
    take: limit,
  });
  return rows.map((r) => {
    const clicks = r._sum.clicks ?? 0;
    const impressions = r._sum.impressions ?? 0;
    return {
      query: r.query,
      clicks,
      impressions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      avgPosition: r._avg.position ?? 0,
    };
  });
}

// ----------------------------------------------------------------------------
// Ingest — Google Search Console CSV or API.
// ----------------------------------------------------------------------------

export interface GscRow {
  date: string | Date;        // YYYY-MM-DD or Date
  query: string;
  page: string;
  country?: string | null;    // ISO 3166-1 alpha-3 from GSC, normalized below
  device?: string | null;     // DESKTOP | MOBILE | TABLET
  clicks: number;
  impressions: number;
  ctr?: number;
  position: number;
}

export async function importGscRows(rows: GscRow[]): Promise<{ inserted: number; pages: number }> {
  if (rows.length === 0) return { inserted: 0, pages: 0 };

  // Normalize once so downstream code never has to re-check.
  interface NormalQueryRow {
    date: Date;
    query: string;
    page: string;
    countryCode: string;
    device: string;
    clicks: number;
    impressions: number;
    position: number;
    ctr: number;
  }
  const queryData: NormalQueryRow[] = rows.map((r) => {
    const date = typeof r.date === "string" ? new Date(r.date) : r.date;
    return {
      date,
      query: r.query.slice(0, 500),
      page: r.page.slice(0, 1000),
      countryCode: r.country ? r.country.toUpperCase() : "ALL",
      device: r.device ? r.device.toUpperCase() : "ALL",
      clicks: r.clicks,
      impressions: r.impressions,
      position: r.position,
      ctr: r.ctr ?? (r.impressions > 0 ? r.clicks / r.impressions : 0),
    };
  });

  // Page-level rollup — derived from the same rows.
  const pageBuckets = new Map<
    string,
    { date: Date; path: string; clicks: number; impressions: number; positionWeighted: number }
  >();
  for (const r of queryData) {
    const key = `${r.date.toISOString().slice(0, 10)}|${r.page}`;
    const existing = pageBuckets.get(key);
    if (existing) {
      existing.clicks += r.clicks;
      existing.impressions += r.impressions;
      existing.positionWeighted += r.position * r.impressions;
    } else {
      pageBuckets.set(key, {
        date: r.date,
        path: r.page,
        clicks: r.clicks,
        impressions: r.impressions,
        positionWeighted: r.position * r.impressions,
      });
    }
  }
  interface NormalPageRow {
    date: Date;
    path: string;
    clicks: number;
    impressions: number;
    avgPosition: number;
    ctr: number;
  }
  const pageData: NormalPageRow[] = Array.from(pageBuckets.values()).map((b) => ({
    date: b.date,
    path: b.path,
    clicks: b.clicks,
    impressions: b.impressions,
    avgPosition: b.impressions > 0 ? b.positionWeighted / b.impressions : 0,
    ctr: b.impressions > 0 ? b.clicks / b.impressions : 0,
  }));

  await prisma.$transaction([
    // Delete the existing slice for these (date,page) tuples to avoid
    // double-counting on re-import.
    ...uniqueDates(queryData, "page").map((d) =>
      prisma.seoQueryDaily.deleteMany({ where: { date: d.date, page: { in: d.pages } } }),
    ),
    prisma.seoQueryDaily.createMany({ data: queryData, skipDuplicates: true }),
    ...uniqueDates(pageData, "path").map((d) =>
      prisma.seoPageDaily.deleteMany({ where: { date: d.date, path: { in: d.pages } } }),
    ),
    prisma.seoPageDaily.createMany({ data: pageData, skipDuplicates: true }),
    prisma.analyticsConfig.update({
      where: { id: "singleton" },
      data: { gscLastSyncAt: new Date() },
    }),
  ]);

  return { inserted: queryData.length, pages: pageData.length };
}

function uniqueDates<T extends { date: Date }>(rows: T[], key: "page" | "path"): Array<{ date: Date; pages: string[] }> {
  const map = new Map<string, { date: Date; pages: Set<string> }>();
  for (const r of rows) {
    const path = (r as unknown as Record<string, string | undefined>)[key] ?? "";
    const dateKey = r.date.toISOString().slice(0, 10);
    const existing = map.get(dateKey);
    if (existing) existing.pages.add(path);
    else map.set(dateKey, { date: r.date, pages: new Set([path]) });
  }
  return Array.from(map.values()).map((v) => ({ date: v.date, pages: Array.from(v.pages) }));
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

// Parse a GSC export CSV (the "Pages" + "Queries" combined dump format).
// Columns we accept (flexible): date, query, page, country, device, clicks,
// impressions, ctr, position. Anything else is ignored.
export function parseGscCsv(csv: string): GscRow[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0]!.split(",").map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ""));
  const idx = (name: string) => header.indexOf(name);
  const out: GscRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    if (cols.length < 3) continue;
    const row: GscRow = {
      date: cols[idx("date")] ?? "",
      query: cols[idx("query")] ?? "",
      page: cols[idx("page")] ?? cols[idx("landing page")] ?? "",
      country: idx("country") >= 0 ? cols[idx("country")] : null,
      device: idx("device") >= 0 ? cols[idx("device")] : null,
      clicks: numFromCsv(cols[idx("clicks")]),
      impressions: numFromCsv(cols[idx("impressions")]),
      ctr: idx("ctr") >= 0 ? numFromCsv(cols[idx("ctr")]) : undefined,
      position: numFromCsv(cols[idx("position")]),
    };
    if (row.date && row.page) out.push(row);
  }
  return out;
}

function numFromCsv(s: string | undefined): number {
  if (!s) return 0;
  const cleaned = s.replace(/[%"]/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}
