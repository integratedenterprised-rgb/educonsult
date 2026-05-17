import { z } from "zod";

export const presignSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  folder: z.string().max(80).optional(),
});

export const recordUploadSchema = z.object({
  key: z.string().min(1).max(400),
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative(),
  width: z.number().int().nonnegative().optional(),
  height: z.number().int().nonnegative().optional(),
  folder: z.string().max(80).optional(),
  alt: z.string().max(300).optional(),
});

export const mediaUpdateSchema = z.object({
  alt: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  folder: z.string().max(80).optional(),
});

export type PresignInput = z.infer<typeof presignSchema>;
export type RecordUploadInput = z.infer<typeof recordUploadSchema>;
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;
