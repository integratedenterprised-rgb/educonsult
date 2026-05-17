/**
 * Singleton analytics configuration.
 *
 * The row is created lazily on first read so admins never see a "no config"
 * error. Heatmap providers, pixel IDs, and the IP-hash salt all live here.
 *
 * The IP hash salt is sensitive — only ADMIN+ can read it. The public client
 * uses `getPublicAnalyticsConfig()` which strips secrets.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { unstable_cache, revalidateTag } from "next/cache";
import type { AnalyticsConfig, HeatmapProvider } from "@prisma/client";

const CONFIG_TAG = "analytics:config";
const SINGLETON_ID = "singleton";

async function readOrCreate(): Promise<AnalyticsConfig> {
  const existing = await prisma.analyticsConfig.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return prisma.analyticsConfig.create({
    data: {
      id: SINGLETON_ID,
      ipHashSalt: crypto.randomUUID(),
    },
  });
}

export const getAnalyticsConfig = unstable_cache(
  async (): Promise<AnalyticsConfig> => readOrCreate(),
  ["analytics-config"],
  { tags: [CONFIG_TAG] },
);

export interface PublicAnalyticsConfig {
  ga4MeasurementId: string | null;
  gtmContainerId: string | null;
  metaPixelId: string | null;
  heatmapProvider: HeatmapProvider;
  clarityProjectId: string | null;
  hotjarSiteId: string | null;
  posthogApiKey: string | null;
  posthogHost: string | null;
  fullstoryOrgId: string | null;
  respectDoNotTrack: boolean;
  requireConsent: boolean;
}

export async function getPublicAnalyticsConfig(): Promise<PublicAnalyticsConfig> {
  const c = await getAnalyticsConfig();
  return {
    ga4MeasurementId: c.ga4MeasurementId,
    gtmContainerId: c.gtmContainerId,
    metaPixelId: c.metaPixelId,
    heatmapProvider: c.heatmapProvider,
    clarityProjectId: c.clarityProjectId,
    hotjarSiteId: c.hotjarSiteId,
    posthogApiKey: c.posthogApiKey,
    posthogHost: c.posthogHost,
    fullstoryOrgId: c.fullstoryOrgId,
    respectDoNotTrack: c.respectDoNotTrack,
    requireConsent: c.requireConsent,
  };
}

export interface UpdateAnalyticsConfigInput {
  ga4MeasurementId?: string | null;
  gtmContainerId?: string | null;
  metaPixelId?: string | null;
  heatmapProvider?: HeatmapProvider;
  clarityProjectId?: string | null;
  hotjarSiteId?: string | null;
  posthogApiKey?: string | null;
  posthogHost?: string | null;
  fullstoryOrgId?: string | null;
  respectDoNotTrack?: boolean;
  requireConsent?: boolean;
  gscSiteUrl?: string | null;
}

export async function updateAnalyticsConfig(
  input: UpdateAnalyticsConfigInput,
): Promise<AnalyticsConfig> {
  await readOrCreate();
  const updated = await prisma.analyticsConfig.update({
    where: { id: SINGLETON_ID },
    data: input,
  });
  revalidateTag(CONFIG_TAG);
  return updated;
}

export async function rotateIpHashSalt(): Promise<void> {
  await readOrCreate();
  await prisma.analyticsConfig.update({
    where: { id: SINGLETON_ID },
    data: { ipHashSalt: crypto.randomUUID() },
  });
  revalidateTag(CONFIG_TAG);
}
