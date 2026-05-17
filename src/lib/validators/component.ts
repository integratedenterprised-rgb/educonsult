import { z } from "zod";

export const componentUpsertSchema = z.object({
  key: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1).max(120),
  type: z.string().min(1).max(80),
  props: z.unknown(),
  isReusable: z.boolean().default(true),
});

export type ComponentUpsertInput = z.infer<typeof componentUpsertSchema>;
