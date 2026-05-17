/**
 * Reusable Component library — global blocks an editor can drop into pages.
 */
import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const KEY_TAKEN = "KEY_TAKEN";
export const NOT_FOUND = "NOT_FOUND";

export interface ComponentUpsertInput {
  key: string;
  name: string;
  type: string;
  props?: unknown;
  isReusable?: boolean;
}

export async function listComponents() {
  return prisma.component.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { sections: true } } },
  });
}

export async function getComponent(id: string) {
  return prisma.component.findFirst({ where: { id, deletedAt: null } });
}

export async function createComponent(input: ComponentUpsertInput) {
  try {
    return await prisma.component.create({
      data: {
        key: input.key,
        name: input.name,
        type: input.type,
        props: input.props as Prisma.InputJsonValue,
        isReusable: input.isReusable ?? true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new Error(KEY_TAKEN);
    throw e;
  }
}

export async function updateComponent(id: string, input: ComponentUpsertInput) {
  const existing = await prisma.component.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  try {
    return await prisma.component.update({
      where: { id },
      data: {
        key: input.key, name: input.name, type: input.type,
        props: input.props as Prisma.InputJsonValue,
        isReusable: input.isReusable ?? true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new Error(KEY_TAKEN);
    throw e;
  }
}

export async function duplicateComponent(id: string) {
  const c = await prisma.component.findFirst({ where: { id, deletedAt: null } });
  if (!c) throw new Error(NOT_FOUND);
  return prisma.component.create({
    data: {
      key: `${c.key}-copy-${Date.now()}`,
      name: `${c.name} (copy)`,
      type: c.type, props: c.props as Prisma.InputJsonValue,
      isReusable: c.isReusable,
    },
  });
}

export async function softDeleteComponent(id: string) {
  const existing = await prisma.component.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  await prisma.component.update({ where: { id }, data: { deletedAt: new Date() } });
}
