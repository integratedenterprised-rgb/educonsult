/**
 * Admin dashboard metrics.
 *
 * Two surfaces:
 *  - "Fast counts" for the `/admin` overview tiles (`getDashboardMetrics`).
 *  - Conversion / source / country / form / SEO blocks for `/admin/analytics`.
 *
 * Read-only. Every query is bounded by a count or a small `take` window so
 * these can safely be called from any admin route.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { LeadStatus, LeadSource } from "@prisma/client";

export interface DashboardMetrics {
  pages: { total: number; published: number; drafts: number };
  blog: { total: number; published: number; drafts: number };
  leads: { total: number; openThisWeek: number; thisMonth: number };
  testimonials: { total: number };
  resources: { total: number };
  countries: { total: number };
  forms: { total: number };
  media: { total: number };
}

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const [
    pagesTotal, pagesPublished, pagesDrafts,
    blogTotal, blogPublished, blogDrafts,
    leadsTotal, leadsOpenWeek, leadsMonth,
    testimonialsTotal, resourcesTotal, countriesTotal, formsTotal,
    mediaTotal,
  ] = await Promise.all([
    prisma.page.count({ where: { deletedAt: null } }),
    prisma.page.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    prisma.page.count({ where: { deletedAt: null, status: "DRAFT" } }),
    prisma.blogPost.count({ where: { deletedAt: null } }),
    prisma.blogPost.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { deletedAt: null, status: "DRAFT" } }),
    prisma.leadSubmission.count({ where: { deletedAt: null } }),
    prisma.leadSubmission.count({ where: { deletedAt: null, createdAt: { gte: weekStart }, status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }),
    prisma.leadSubmission.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } }),
    prisma.testimonial.count({ where: { deletedAt: null } }),
    prisma.resource.count({ where: { deletedAt: null } }),
    prisma.country.count({ where: { deletedAt: null } }),
    prisma.leadForm.count({ where: { deletedAt: null } }),
    prisma.media.count({ where: { deletedAt: null } }).catch(() => 0),
  ]);

  return {
    pages: { total: pagesTotal, published: pagesPublished, drafts: pagesDrafts },
    blog: { total: blogTotal, published: blogPublished, drafts: blogDrafts },
    leads: { total: leadsTotal, openThisWeek: leadsOpenWeek, thisMonth: leadsMonth },
    testimonials: { total: testimonialsTotal },
    resources: { total: resourcesTotal },
    countries: { total: countriesTotal },
    forms: { total: formsTotal },
    media: { total: mediaTotal },
  };
}

export interface LeadsTimeseriesPoint {
  date: string;
  count: number;
}

export async function getLeadsTimeseries(days = 30): Promise<LeadsTimeseriesPoint[]> {
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const leads = await prisma.leadSubmission.findMany({
    where: { deletedAt: null, createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const l of leads) {
    const key = l.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export async function getRecentActivity(limit = 10) {
  const [pages, leads, posts] = await Promise.all([
    prisma.page.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, title: true, slug: true, updatedAt: true, status: true },
    }),
    prisma.leadSubmission.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, fullName: true, email: true, source: true, createdAt: true, status: true },
    }),
    prisma.blogPost.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, title: true, slug: true, updatedAt: true, status: true },
    }),
  ]);
  return { pages, leads, posts };
}

// ----------------------------------------------------------------------------
// Conversion + attribution
// ----------------------------------------------------------------------------

export interface ConversionMetrics {
  /** Total leads in range. */
  leads: number;
  /** Unique converting visitors (sessions with a leadId). */
  uniqueConverters: number;
  /** Total sessions in range. */
  sessions: number;
  /** sessions → leads. */
  sessionToLeadRate: number;
  /** leads with status WON. */
  won: number;
  /** leads with status LOST. */
  lost: number;
  /** WON ÷ total leads. */
  winRate: number;
}

export async function getConversionMetrics(days = 90): Promise<ConversionMetrics> {
  const since = sinceDays(days);
  const [leads, won, lost, sessions, converters] = await Promise.all([
    prisma.leadSubmission.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
    prisma.leadSubmission.count({ where: { deletedAt: null, createdAt: { gte: since }, status: "WON" } }),
    prisma.leadSubmission.count({ where: { deletedAt: null, createdAt: { gte: since }, status: "LOST" } }),
    prisma.analyticsSession.count({ where: { startedAt: { gte: since } } }),
    prisma.analyticsSession.count({ where: { startedAt: { gte: since }, leadId: { not: null } } }),
  ]);
  return {
    leads,
    uniqueConverters: converters,
    sessions,
    sessionToLeadRate: sessions > 0 ? converters / sessions : 0,
    won,
    lost,
    winRate: leads > 0 ? won / leads : 0,
  };
}

// ----------------------------------------------------------------------------
// Lead sources
// ----------------------------------------------------------------------------

export interface LeadSourceRow {
  source: LeadSource;
  count: number;
  won: number;
  conversion: number;
}

export async function getLeadSources(days = 90): Promise<LeadSourceRow[]> {
  const since = sinceDays(days);
  const [totals, wins] = await Promise.all([
    prisma.leadSubmission.groupBy({
      by: ["source"],
      where: { deletedAt: null, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.leadSubmission.groupBy({
      by: ["source"],
      where: { deletedAt: null, createdAt: { gte: since }, status: "WON" },
      _count: { _all: true },
    }),
  ]);
  const winMap = new Map(wins.map((w) => [w.source, w._count._all] as const));
  return totals.map((t) => {
    const won = winMap.get(t.source) ?? 0;
    return {
      source: t.source,
      count: t._count._all,
      won,
      conversion: t._count._all > 0 ? won / t._count._all : 0,
    };
  });
}

export interface LeadStatusRow {
  status: LeadStatus;
  count: number;
}

export async function getLeadStatusBreakdown(days = 90): Promise<LeadStatusRow[]> {
  const since = sinceDays(days);
  const rows = await prisma.leadSubmission.groupBy({
    by: ["status"],
    where: { deletedAt: null, createdAt: { gte: since } },
    _count: { _all: true },
  });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}

// ----------------------------------------------------------------------------
// Country interest — destination country the lead asked about, plus visitor
// country (from GeoIP) for traffic origin.
// ----------------------------------------------------------------------------

export interface CountryInterestRow {
  /** Destination country code (the country the lead asked about). */
  countryCode: string;
  countryName: string | null;
  leads: number;
  visitors: number;
  conversion: number;
}

export async function getCountryInterest(days = 90, limit = 20): Promise<CountryInterestRow[]> {
  const since = sinceDays(days);

  const [leadsByCountry, visitorsByCountry, namesRows] = await Promise.all([
    prisma.leadSubmission.groupBy({
      by: ["countryCode"],
      where: { deletedAt: null, createdAt: { gte: since }, countryCode: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    }),
    // Sessions whose path contained a country slug — a cheaper proxy is to
    // bucket the `AnalyticsEvent` rows with non-null countryId. We use the
    // page-visit table.
    prisma.analyticsEvent.groupBy({
      by: ["countryId"],
      where: { type: "COUNTRY_VIEW", createdAt: { gte: since }, countryId: { not: null } },
      _count: { _all: true },
    }),
    prisma.country.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true, slug: true, translations: { select: { locale: true, name: true } } },
    }),
  ]);

  const nameByCode = new Map<string, string>();
  const idByCode = new Map<string, string>();
  for (const c of namesRows) {
    const en = c.translations.find((t) => t.locale === "EN")?.name ?? c.slug;
    nameByCode.set(c.code.toUpperCase(), en);
    idByCode.set(c.code.toUpperCase(), c.id);
  }
  const codeById = new Map<string, string>();
  for (const c of namesRows) codeById.set(c.id, c.code.toUpperCase());

  const visitorsByCode = new Map<string, number>();
  for (const v of visitorsByCountry) {
    if (!v.countryId) continue;
    const code = codeById.get(v.countryId);
    if (!code) continue;
    visitorsByCode.set(code, (visitorsByCode.get(code) ?? 0) + v._count._all);
  }

  return leadsByCountry
    .filter((r) => r.countryCode)
    .map((r) => {
      const code = r.countryCode!.toUpperCase();
      const leads = r._count._all;
      const visitors = visitorsByCode.get(code) ?? 0;
      return {
        countryCode: code,
        countryName: nameByCode.get(code) ?? null,
        leads,
        visitors,
        conversion: visitors > 0 ? leads / visitors : 0,
      };
    });
}

// ----------------------------------------------------------------------------
// Form completion — for each form, % of visitors who started → submitted.
// ----------------------------------------------------------------------------

export interface FormCompletionRow {
  formId: string;
  formKey: string;
  views: number;
  starts: number;
  submits: number;
  errors: number;
  startRate: number;
  completionRate: number;
  errorRate: number;
}

export async function getFormCompletion(days = 90): Promise<FormCompletionRow[]> {
  const since = sinceDays(days);
  const [forms, eventGroups] = await Promise.all([
    prisma.leadForm.findMany({
      where: { deletedAt: null },
      select: { id: true, key: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["formId", "type"],
      where: {
        createdAt: { gte: since },
        formId: { not: null },
        type: { in: ["FORM_VIEW", "FORM_START", "FORM_SUBMIT", "FORM_SUCCESS", "FORM_ERROR", "FORM_ABANDONED"] },
      },
      _count: { _all: true },
    }),
  ]);

  const byForm = new Map<string, Record<string, number>>();
  for (const g of eventGroups) {
    if (!g.formId) continue;
    const slot = byForm.get(g.formId) ?? {};
    slot[g.type] = g._count._all;
    byForm.set(g.formId, slot);
  }

  return forms.map((f) => {
    const s = byForm.get(f.id) ?? {};
    const views = s["FORM_VIEW"] ?? 0;
    const starts = s["FORM_START"] ?? 0;
    const submits = (s["FORM_SUCCESS"] ?? 0) || (s["FORM_SUBMIT"] ?? 0);
    const errors = s["FORM_ERROR"] ?? 0;
    return {
      formId: f.id,
      formKey: f.key,
      views,
      starts,
      submits,
      errors,
      startRate: views > 0 ? starts / views : 0,
      completionRate: starts > 0 ? submits / starts : 0,
      errorRate: starts > 0 ? errors / starts : 0,
    };
  });
}

// ----------------------------------------------------------------------------
// Traffic sources (analytics-side, not lead-side)
// ----------------------------------------------------------------------------

export interface TrafficSourceRow {
  source: string;
  sessions: number;
  leads: number;
  conversion: number;
}

export async function getTrafficSources(days = 30, limit = 12): Promise<TrafficSourceRow[]> {
  const since = sinceDays(days);
  const sessionRows = await prisma.analyticsSession.groupBy({
    by: ["utmSource"],
    where: { startedAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  const leadRows = await prisma.analyticsSession.groupBy({
    by: ["utmSource"],
    where: { startedAt: { gte: since }, leadId: { not: null } },
    _count: { _all: true },
  });
  const leadMap = new Map(leadRows.map((l) => [l.utmSource ?? "(direct)", l._count._all] as const));
  return sessionRows.map((r) => {
    const source = r.utmSource ?? "(direct)";
    const sessions = r._count._all;
    const leads = leadMap.get(source) ?? 0;
    return {
      source,
      sessions,
      leads,
      conversion: sessions > 0 ? leads / sessions : 0,
    };
  });
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function sinceDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}
