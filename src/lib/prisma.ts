/**
 * Prisma singleton. In dev, Next.js hot-reload would otherwise spawn a new
 * client per HMR cycle and exhaust the connection pool.
 */
import { PrismaClient } from "@prisma/client";
import { serverEnv } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: serverEnv.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (serverEnv.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
