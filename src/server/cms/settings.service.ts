import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";
import type { SiteSettingsDto } from "@/types/cms";

const SETTINGS_TAG = "cms:settings";

function pickString(map: Map<string, unknown>, key: string, fallback = ""): string {
  const v = map.get(key);
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

function emptySettings(): SiteSettingsDto {
  return {
    name: siteConfig.fallbackName,
    tagline: "",
    logoUrl: "",
    contact: { email: "", phone: "", address: "" },
    social: { facebook: "", instagram: "", linkedin: "" },
  };
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsDto> => {
    let rows: { key: string; value: unknown }[] = [];
    try {
      rows = await prisma.siteSetting.findMany({ where: { isPublic: true } });
    } catch {
      // DB unreachable (typically during Docker build prerender). Return
      // defaults; runtime requests will revalidate against the live DB.
      return emptySettings();
    }
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      name: pickString(map, "site.name", siteConfig.fallbackName),
      tagline: pickString(map, "site.tagline"),
      logoUrl: pickString(map, "site.logoUrl"),
      contact: {
        email: pickString(map, "contact.email"),
        phone: pickString(map, "contact.phone"),
        address: pickString(map, "contact.address"),
      },
      social: {
        facebook: pickString(map, "social.facebook"),
        instagram: pickString(map, "social.instagram"),
        linkedin: pickString(map, "social.linkedin"),
      },
    };
  },
  ["site-settings"],
  { revalidate: siteConfig.cache.settings, tags: [SETTINGS_TAG] },
);

export async function setSetting(key: string, value: unknown) {
  await prisma.siteSetting.update({ where: { key }, data: { value: value as never } });
  revalidateTag(SETTINGS_TAG);
}
