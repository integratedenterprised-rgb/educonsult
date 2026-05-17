import { z } from "zod";

export const navItemInputSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().min(1).max(2048),
  iconKey: z.string().max(64).optional().nullable(),
  order: z.number().int().nonnegative(),
  openInNew: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  parentId: z.string().cuid().optional().nullable(),
});

export type NavItemInput = z.infer<typeof navItemInputSchema>;
