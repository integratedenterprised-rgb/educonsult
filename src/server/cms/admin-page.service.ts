/**
 * Admin-facing CRUD for pages. Distinct from `page.service.ts` (which is the
 * cached public read path). Writes here invalidate the public cache tag for
 * the affected slug so changes go live instantly.
 */
import "server-only";
import { revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import type { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PageCreateInput, PageUpdateInput } from "@/lib/validators/page";
import { sanitizeSectionsHtml } from "@/lib/security/sanitize";

export const SLUG_TAKEN = "SLUG_TAKEN";
export const HOMEPAGE_CONFLICT = "HOMEPAGE_CONFLICT";

const PAGE_TAG = (slug: string) => `cms:page:${slug}`;

export const PAGE_SORT_FIELDS = ["updatedAt", "title", "status"] as const;
export type PageSortField = (typeof PAGE_SORT_FIELDS)[number];

export interface ListAdminPagesParams {
  query?: string;
  status?: ContentStatus;
  template?: string;
  isHomepage?: boolean;
  sort?: PageSortField;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface AdminPageListRow {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  isHomepage: boolean;
  updatedAt: Date;
  template: string | null;
}

export interface ListAdminPagesResult {
  rows: AdminPageListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  templates: string[];
}

const DEFAULT_PAGE_SIZE = 20;

export async function listAdminPages(params: ListAdminPagesParams = {}): Promise<ListAdminPagesResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
  const sort: PageSortField = PAGE_SORT_FIELDS.includes(params.sort as PageSortField)
    ? (params.sort as PageSortField)
    : "updatedAt";
  const order: "asc" | "desc" = params.order === "asc" ? "asc" : "desc";

  const where: Prisma.PageWhereInput = {
    deletedAt: null,
    ...(params.query
      ? {
          OR: [
            { title: { contains: params.query, mode: "insensitive" } },
            { slug: { contains: params.query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.template ? { template: params.template } : {}),
    ...(typeof params.isHomepage === "boolean" ? { isHomepage: params.isHomepage } : {}),
  };

  // Homepage always pinned first regardless of sort.
  const orderBy: Prisma.PageOrderByWithRelationInput[] = [
    { isHomepage: "desc" },
    { [sort]: order } as Prisma.PageOrderByWithRelationInput,
  ];

  const [rows, total, templateRows] = await Promise.all([
    prisma.page.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        isHomepage: true,
        updatedAt: true,
        template: true,
      },
    }),
    prisma.page.count({ where }),
    prisma.page.findMany({
      where: { deletedAt: null, template: { not: null } },
      distinct: ["template"],
      select: { template: true },
      orderBy: { template: "asc" },
    }),
  ]);

  const templates = templateRows
    .map((r) => r.template)
    .filter((t): t is string => typeof t === "string" && t.length > 0);

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    templates,
  };
}

export async function getAdminPage(id: string) {
  return prisma.page.findFirst({ where: { id, deletedAt: null } });
}

export async function createPage(input: PageCreateInput) {
  try {
    return await prisma.page.create({
      data: {
        title: input.title,
        slug: input.slug,
        template: input.template ?? null,
        isHomepage: input.isHomepage ?? false,
        status: "DRAFT",
        sections: [],
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function updatePage(id: string, input: PageUpdateInput, actorId?: string) {
  const existing = await prisma.page.findUnique({
    where: { id },
    select: { slug: true, isHomepage: true, status: true, sections: true, title: true, template: true, seoTitle: true, seoDescription: true, seoKeywords: true, ogImageUrl: true },
  });
  if (!existing) throw new Error("NOT_FOUND");

  // Snapshot the *prior* state before overwriting — so "version N" represents
  // what the page looked like before this save. Restoring rolls back here.
  const lastVersion = await prisma.pageVersion.findFirst({
    where: { pageId: id }, orderBy: { version: "desc" }, select: { version: true },
  });
  const nextVersion = (lastVersion?.version ?? 0) + 1;

  // Sanitize HTML inside richText sections at the write boundary so the
  // public renderer's dangerouslySetInnerHTML can never receive a payload
  // with active script/event handlers. AUTHOR-role accounts can write pages,
  // so this is the line that prevents stored XSS via a compromised editor.
  const safeSections = sanitizeSectionsHtml(input.sections);

  const data = {
    title: input.title,
    slug: input.slug,
    template: input.template ?? null,
    status: input.status,
    publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    isHomepage: input.isHomepage,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    seoKeywords: input.seoKeywords ?? null,
    ogImageUrl: input.ogImageUrl || null,
    sections: safeSections as unknown as Prisma.InputJsonValue,
  } satisfies Prisma.PageUpdateInput;

  try {
    // Demote-prior-homepage + version-snapshot + update-this-row run in one
    // transaction so a slug-collision failure (P2002) on the update can't
    // leave the previous homepage demoted with no replacement.
    const promoting = input.isHomepage && !existing.isHomepage;
    const updated = await prisma.$transaction(async (tx) => {
      if (promoting) {
        await tx.page.updateMany({
          where: { isHomepage: true, NOT: { id } },
          data: { isHomepage: false },
        });
      }
      await tx.pageVersion.create({
        data: {
          pageId: id,
          version: nextVersion,
          snapshot: {
            title: existing.title,
            template: existing.template,
            status: existing.status,
            sections: existing.sections,
            seoTitle: existing.seoTitle,
            seoDescription: existing.seoDescription,
            seoKeywords: existing.seoKeywords,
            ogImageUrl: existing.ogImageUrl,
          } as Prisma.InputJsonValue,
          createdById: actorId ?? null,
        },
      });
      return tx.page.update({ where: { id }, data });
    });

    revalidateTag(PAGE_TAG(existing.slug));
    if (existing.slug !== updated.slug) revalidateTag(PAGE_TAG(updated.slug));
    if (updated.isHomepage) revalidateTag(PAGE_TAG("home"));

    return updated;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error(SLUG_TAKEN);
    }
    throw e;
  }
}

export async function softDeletePage(id: string) {
  const page = await prisma.page.findUnique({ where: { id }, select: { slug: true, isHomepage: true } });
  if (!page) throw new Error("NOT_FOUND");
  if (page.isHomepage) throw new Error("HOMEPAGE_PROTECTED");

  await prisma.page.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  revalidateTag(PAGE_TAG(page.slug));
}
