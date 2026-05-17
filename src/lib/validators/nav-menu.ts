/**
 * Validators for the navigation editor.
 *
 * The schema is recursive (items can have children which are themselves
 * items). Zod's `z.lazy` is required for self-referential schemas — the
 * explicit `ZodType<NavItemInput>` annotation gives TS the type up front.
 */
import { z } from "zod";

export type NavItemInput = {
  /** Client-generated for new items; server-issued for existing ones. Both treated the same on save. */
  id?: string;
  label: string;
  url: string;
  openInNew: boolean;
  isVisible: boolean;
  children?: NavItemInput[];
};

export const navItemInputSchema: z.ZodType<NavItemInput> = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    label: z.string().min(1, "Label is required").max(80),
    url: z.string().min(1, "URL is required").max(2048),
    openInNew: z.boolean(),
    isVisible: z.boolean(),
    children: z.array(navItemInputSchema).optional(),
  }),
);

export const navMenuInputSchema = z.object({
  items: z.array(navItemInputSchema).max(200),
});

export type NavMenuInput = z.infer<typeof navMenuInputSchema>;
