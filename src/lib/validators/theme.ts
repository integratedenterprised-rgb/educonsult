import { z } from "zod";
import { themeTokensSchema } from "../theme";

export const themeInputSchema = z.object({
  key: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  name: z.string().min(1).max(120),
  isDarkMode: z.boolean().optional(),
  tokens: themeTokensSchema,
  radius: z.number().min(0).max(2),
  fontHeading: z.string().max(80).optional().nullable(),
  fontBody: z.string().max(80).optional().nullable(),
});

export type ThemeInput = z.infer<typeof themeInputSchema>;
