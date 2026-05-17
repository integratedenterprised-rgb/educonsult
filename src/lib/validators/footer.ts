/**
 * Validators for the footer editor. Two-level fixed structure: columns hold
 * links. Both arrays carry their own ordering, sent by the client and
 * persisted as `order` on the DB rows.
 */
import { z } from "zod";

export const footerLinkInputSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required").max(80),
  url: z.string().min(1, "URL is required").max(2048),
  openInNew: z.boolean(),
  isVisible: z.boolean(),
});

export const footerColumnInputSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1).max(64),
  heading: z.string().min(1, "Heading is required").max(120),
  isActive: z.boolean(),
  links: z.array(footerLinkInputSchema).max(40),
});

export const footerInputSchema = z.object({
  columns: z.array(footerColumnInputSchema).max(12),
});

export type FooterLinkInput = z.infer<typeof footerLinkInputSchema>;
export type FooterColumnInput = z.infer<typeof footerColumnInputSchema>;
export type FooterInput = z.infer<typeof footerInputSchema>;
