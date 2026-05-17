/**
 * Theme service — single source of truth for the active site theme.
 *
 * `getActiveTheme()` is the hot path: called from the root layout on every
 * request. The query is wrapped in `unstable_cache` with a "theme" tag so
 * admin saves can revalidate the entire site in one call.
 */
import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FALLBACK_THEME, themeTokensSchema, type ThemeSettings } from "@/lib/theme";
import { siteConfig } from "@/lib/config";
import type { ActiveTheme, ThemePreset } from "@/types/theme";

export const THEME_KEY_TAKEN = "THEME_KEY_TAKEN";
export const THEME_NOT_FOUND = "THEME_NOT_FOUND";
export const THEME_PROTECTED = "THEME_PROTECTED";

const THEME_TAG = "cms:theme";

export const getActiveTheme = unstable_cache(
  async (): Promise<ActiveTheme> => {
    const row =
      (await prisma.siteTheme.findFirst({ where: { isActive: true } })) ??
      (await prisma.siteTheme.findFirst({ where: { isDefault: true } }));

    if (!row) return { ...FALLBACK_THEME, id: "fallback", key: "fallback", name: "Fallback" };

    const tokens = themeTokensSchema.safeParse(row.tokens);
    if (!tokens.success) {
      console.warn(`[theme] Invalid tokens for theme ${row.key}, using fallback`);
      return { ...FALLBACK_THEME, id: row.id, key: row.key, name: row.name };
    }

    return {
      id: row.id,
      key: row.key,
      name: row.name,
      tokens: tokens.data,
      radius: row.radius,
      fontHeading: row.fontHeading,
      fontBody: row.fontBody,
      isDarkMode: row.isDarkMode,
    };
  },
  ["active-theme"],
  { revalidate: siteConfig.cache.theme, tags: [THEME_TAG] },
);

export async function listThemes(): Promise<ThemePreset[]> {
  const rows = await prisma.siteTheme.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] });
  return rows.map((r) => {
    const tokens = themeTokensSchema.safeParse(r.tokens);
    return {
      id: r.id,
      key: r.key,
      name: r.name,
      tokens: tokens.success ? tokens.data : FALLBACK_THEME.tokens,
      radius: r.radius,
      fontHeading: r.fontHeading,
      fontBody: r.fontBody,
      isActive: r.isActive,
      isDefault: r.isDefault,
      isDarkMode: r.isDarkMode,
    };
  });
}

export async function activateTheme(themeId: string): Promise<void> {
  await prisma.$transaction([
    prisma.siteTheme.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.siteTheme.update({ where: { id: themeId }, data: { isActive: true } }),
  ]);
  revalidateTag(THEME_TAG);
}

export async function upsertTheme(input: {
  key: string;
  name: string;
  tokens: ThemeSettings["tokens"];
  radius: number;
  fontHeading?: string | null;
  fontBody?: string | null;
  isDarkMode?: boolean;
}) {
  try {
    const row = await prisma.siteTheme.upsert({
      where: { key: input.key },
      update: {
        name: input.name,
        tokens: input.tokens,
        radius: input.radius,
        fontHeading: input.fontHeading,
        fontBody: input.fontBody,
        isDarkMode: input.isDarkMode,
      },
      create: {
        key: input.key,
        name: input.name,
        tokens: input.tokens,
        radius: input.radius,
        fontHeading: input.fontHeading,
        fontBody: input.fontBody,
        isDarkMode: input.isDarkMode ?? false,
      },
    });
    revalidateTag(THEME_TAG);
    return row;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(THEME_KEY_TAKEN);
    }
    throw e;
  }
}

export async function getThemeById(id: string) {
  return prisma.siteTheme.findUnique({ where: { id } });
}

export async function createTheme(input: {
  key: string;
  name: string;
  tokens: ThemeSettings["tokens"];
  radius: number;
  fontHeading?: string | null;
  fontBody?: string | null;
  isDarkMode?: boolean;
}) {
  try {
    const row = await prisma.siteTheme.create({
      data: {
        key: input.key,
        name: input.name,
        tokens: input.tokens,
        radius: input.radius,
        fontHeading: input.fontHeading,
        fontBody: input.fontBody,
        isDarkMode: input.isDarkMode ?? false,
      },
    });
    revalidateTag(THEME_TAG);
    return row;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(THEME_KEY_TAKEN);
    }
    throw e;
  }
}

export async function updateTheme(
  id: string,
  input: {
    key?: string;
    name: string;
    tokens: ThemeSettings["tokens"];
    radius: number;
    fontHeading?: string | null;
    fontBody?: string | null;
    isDarkMode?: boolean;
  },
) {
  try {
    const row = await prisma.siteTheme.update({
      where: { id },
      data: {
        ...(input.key ? { key: input.key } : {}),
        name: input.name,
        tokens: input.tokens,
        radius: input.radius,
        fontHeading: input.fontHeading,
        fontBody: input.fontBody,
        isDarkMode: input.isDarkMode,
      },
    });
    revalidateTag(THEME_TAG);
    return row;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") throw new Error(THEME_KEY_TAKEN);
      if (e.code === "P2025") throw new Error(THEME_NOT_FOUND);
    }
    throw e;
  }
}

export async function deleteTheme(id: string) {
  const row = await prisma.siteTheme.findUnique({
    where: { id },
    select: { isDefault: true, isActive: true },
  });
  if (!row) throw new Error(THEME_NOT_FOUND);
  if (row.isDefault) throw new Error(THEME_PROTECTED);

  // If the row being deleted is the active theme, promote the default first
  // so the site is never left without an active theme.
  if (row.isActive) {
    await prisma.$transaction(async (tx) => {
      const fallback = await tx.siteTheme.findFirst({
        where: { isDefault: true, NOT: { id } },
        select: { id: true },
      });
      if (fallback) {
        await tx.siteTheme.update({ where: { id: fallback.id }, data: { isActive: true } });
      }
      await tx.siteTheme.delete({ where: { id } });
    });
  } else {
    await prisma.siteTheme.delete({ where: { id } });
  }
  revalidateTag(THEME_TAG);
}
