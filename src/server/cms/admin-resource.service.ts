/**
 * Admin CRUD for Resource entries (PDFs, videos, articles, etc.).
 */
import "server-only";
import { revalidateTag } from "next/cache";
import { Prisma, type ContentStatus, type ResourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SLUG_TAKEN = "SLUG_TAKEN";
export const NOT_FOUND = "NOT_FOUND";
const LIST_TAG = "cms:resources";

export interface ResourceUpsertInput {
  slug: string;
  type: ResourceType;
  fileUrl?: string | null;
  externalUrl?: string | null;
  thumbnailUrl?: string | null;
  fileSize?: number | null;
  pageCount?: number | null;
  gated?: boolean;
  status?: ContentStatus;
  // English translation
  title: string;
  description?: string | null;
}

export async function listResources() {
  return prisma.resource.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { locale: "EN" }, take: 1 } },
  });
}

export async function getResource(id: string) {
  return prisma.resource.findFirst({
    where: { id, deletedAt: null },
    include: { translations: { where: { locale: "EN" }, take: 1 } },
  });
}

export async function createResource(input: ResourceUpsertInput) {
  try {
    const r = await prisma.resource.create({
      data: {
        slug: input.slug,
        type: input.type,
        fileUrl: input.fileUrl ?? null,
        externalUrl: input.externalUrl ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        fileSize: input.fileSize ?? null,
        pageCount: input.pageCount ?? null,
        gated: input.gated ?? false,
        status: input.status ?? "DRAFT",
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        translations: {
          create: { locale: "EN", title: input.title, description: input.description ?? null },
        },
      },
    });
    revalidateTag(LIST_TAG);
    return r;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new Error(SLUG_TAKEN);
    throw e;
  }
}

export async function updateResource(id: string, input: ResourceUpsertInput) {
  const existing = await prisma.resource.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  try {
    await prisma.$transaction([
      prisma.resource.update({
        where: { id },
        data: {
          slug: input.slug,
          type: input.type,
          fileUrl: input.fileUrl ?? null,
          externalUrl: input.externalUrl ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          fileSize: input.fileSize ?? null,
          pageCount: input.pageCount ?? null,
          gated: input.gated ?? false,
          status: input.status ?? "DRAFT",
          publishedAt: input.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null,
        },
      }),
      prisma.resourceTranslation.upsert({
        where: { resourceId_locale: { resourceId: id, locale: "EN" } },
        update: { title: input.title, description: input.description ?? null },
        create: { resourceId: id, locale: "EN", title: input.title, description: input.description ?? null },
      }),
    ]);
    revalidateTag(LIST_TAG);
    revalidateTag(`cms:resource:${input.slug}`);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new Error(SLUG_TAKEN);
    throw e;
  }
}

export async function softDeleteResource(id: string) {
  const existing = await prisma.resource.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  await prisma.resource.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  revalidateTag(LIST_TAG);
  revalidateTag(`cms:resource:${existing.slug}`);
}
