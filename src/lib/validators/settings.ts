/**
 * Site-settings validators.
 *
 * SiteSetting rows are key/value/group records. To stay flexible (the admin
 * can add new keys later without schema changes) the validator accepts a flat
 * record of allowed keys → values. URL fields tolerate empty strings since
 * settings are often "blank until configured".
 */
import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const settingsInputSchema = z.object({
  "site.name": z.string().min(1, "Site name is required").max(120),
  "site.tagline": z.string().max(200),
  "site.logoUrl": optionalUrl,
  "contact.email": z.string().email("Invalid email").optional().or(z.literal("")),
  "contact.phone": z.string().max(40),
  "contact.address": z.string().max(400),
  "social.facebook": optionalUrl,
  "social.instagram": optionalUrl,
  "social.linkedin": optionalUrl,
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;

export const SETTINGS_GROUPS = {
  branding: ["site.name", "site.tagline", "site.logoUrl"],
  contact: ["contact.email", "contact.phone", "contact.address"],
  social: ["social.facebook", "social.instagram", "social.linkedin"],
} as const satisfies Record<string, ReadonlyArray<keyof SettingsInput>>;
