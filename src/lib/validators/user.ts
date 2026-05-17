import { z } from "zod";
import { passwordSchema } from "@/lib/security/password";

const ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "COUNSELOR", "VIEWER"] as const;

// `passwordSchema` enforces ≥12 chars + composition + block list. Reused
// from the security lib so server-side hashing and any UI form share one
// definition of "strong enough".
export const userCreateSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(120),
  password: passwordSchema,
  role: z.enum(ROLES),
});

// On update, password is optional. An empty string from the form means
// "no change" — coerce to undefined so the service short-circuits the hash.
export const userUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  password: z
    .union([z.literal(""), passwordSchema])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
