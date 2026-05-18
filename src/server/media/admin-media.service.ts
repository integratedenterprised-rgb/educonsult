/**
 * Media library service. Two-phase upload:
 *   1) Client asks `/api/admin/media/presign` for a presigned PUT URL.
 *   2) Client PUTs the file directly to S3, then POSTs metadata to
 *      `/api/admin/media` which writes the row.
 *
 * This avoids streaming bytes through the Next server.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBucket, getPublicUrl, getS3Client } from "./s3-client";

export const NOT_FOUND = "NOT_FOUND";

const SAFE_FOLDER = /^[a-z0-9][a-z0-9\-/]*$/i;

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function presignUpload(input: {
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
  const folder = input.folder && SAFE_FOLDER.test(input.folder) ? input.folder : "uploads";
  const id = randomUUID();
  const key = `${folder}/${id}-${safeFilename(input.filename)}`;
  const client = getS3Client();
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ContentType: input.contentType,
    }),
    { expiresIn: 60 * 5 },
  );
  return { key, uploadUrl, publicUrl: getPublicUrl(key) };
}

export interface RecordUploadInput {
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  folder?: string;
  alt?: string;
  uploadedById?: string;
}

export async function recordUpload(input: RecordUploadInput) {
  return prisma.media.create({
    data: {
      key: input.key,
      url: getPublicUrl(input.key),
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      folder: input.folder ?? "uploads",
      alt: input.alt ?? null,
      uploadedById: input.uploadedById ?? null,
    },
  });
}

export interface ListMediaParams {
  query?: string;
  folder?: string;
  mimeStart?: string; // e.g. "image/"
  page?: number;
  pageSize?: number;
}

export async function listMedia(params: ListMediaParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 48));
  const where: Prisma.MediaWhereInput = {
    deletedAt: null,
    ...(params.query ? { filename: { contains: params.query, mode: "insensitive" } } : {}),
    ...(params.folder ? { folder: params.folder } : {}),
    ...(params.mimeStart ? { mimeType: { startsWith: params.mimeStart } } : {}),
  };
  const [rows, total, folderRows] = await Promise.all([
    prisma.media.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
    prisma.media.count({ where }),
    prisma.media.findMany({
      where: { deletedAt: null, folder: { not: null } },
      distinct: ["folder"], select: { folder: true }, orderBy: { folder: "asc" },
    }),
  ]);
  return {
    rows, total, page, pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    folders: folderRows.map((f) => f.folder).filter((x): x is string => Boolean(x)),
  };
}

export async function updateMedia(id: string, data: { alt?: string; caption?: string; folder?: string }) {
  const existing = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  return prisma.media.update({
    where: { id },
    data: {
      alt: data.alt ?? null,
      caption: data.caption ?? null,
      folder: data.folder?.trim() || existing.folder,
    },
  });
}

export async function softDeleteMedia(id: string) {
  const existing = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error(NOT_FOUND);
  // Best-effort delete from S3 — failure shouldn't block the row's soft-delete.
  try {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: existing.key }));
  } catch { /* swallow */ }
  await prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });
}
