/**
 * Admin CRUD for SiteSetting rows.
 *
 * Settings are flat key/value records. Read returns a typed map keyed by the
 * stable setting key (`site.name`, `contact.email`, etc.). Write does a
 * bulk upsert inside a transaction and invalidates the public settings tag.
 */
import "server-only";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { SettingsInput } from "@/lib/validators/settings";

const SETTINGS_TAG = "cms:settings";

const TYPE_BY_KEY: Record<keyof SettingsInput, string> = {
  "site.name": "string",
  "site.tagline": "string",
  "site.logoUrl": "image",
  "contact.email": "string",
  "contact.phone": "string",
  "contact.address": "text",
  "social.facebook": "url",
  "social.instagram": "url",
  "social.linkedin": "url",
};

const GROUP_BY_KEY: Record<keyof SettingsInput, string> = {
  "site.name": "branding",
  "site.tagline": "branding",
  "site.logoUrl": "branding",
  "contact.email": "contact",
  "contact.phone": "contact",
  "contact.address": "contact",
  "social.facebook": "social",
  "social.instagram": "social",
  "social.linkedin": "social",
};

const DEFAULTS: SettingsInput = {
  "site.name": "",
  "site.tagline": "",
  "site.logoUrl": "",
  "contact.email": "",
  "contact.phone": "",
  "contact.address": "",
  "social.facebook": "",
  "social.instagram": "",
  "social.linkedin": "",
};

export async function getAdminSettings(): Promise<SettingsInput> {
  const rows = await prisma.siteSetting.findMany();
  const result: SettingsInput = { ...DEFAULTS };
  for (const row of rows) {
    if (row.key in result) {
      // value is JSON; we only store strings in this scope.
      const v = row.value;
      (result as Record<string, string>)[row.key] = typeof v === "string" ? v : v == null ? "" : String(v);
    }
  }
  return result;
}

export async function saveAdminSettings(input: SettingsInput) {
  await prisma.$transaction(
    (Object.keys(input) as Array<keyof SettingsInput>).map((key) => {
      const value = input[key] ?? "";
      return prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: {
          key,
          group: GROUP_BY_KEY[key],
          type: TYPE_BY_KEY[key],
          value,
        },
      });
    }),
  );
  revalidateTag(SETTINGS_TAG);
}
