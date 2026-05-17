/**
 * Password hashing + strength validation.
 *
 * - Bcrypt cost factor 12. Higher is better, but 12 keeps logins under ~250ms
 *   on commodity hardware; users notice anything past that.
 * - `DUMMY_HASH` is a real bcrypt-12 hash of a random string. The credentials
 *   provider compares against it when no user row is found so the response
 *   time is indistinguishable from a wrong-password case — closes the email
 *   enumeration timing side-channel.
 * - The Zod schema is the single source of truth for password policy. Reuse
 *   it in any UI form (set/reset/admin-create) so the front-end and server
 *   agree.
 */
import "server-only";
import bcrypt from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 12;

/**
 * Pre-computed bcrypt-12 hash of a random 32-byte secret. Generated once at
 * module load — no I/O on the hot path. The actual plaintext is discarded.
 */
export const DUMMY_HASH = bcrypt.hashSync(
  // 32 random bytes encoded as hex; the value is irrelevant since we throw
  // it away. We just need a real hash for `bcrypt.compare()` to spend CPU on.
  Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join(""),
  BCRYPT_COST,
);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Burn the same CPU we would on a real verify, for the email-enumeration
 * timing case. Always returns false.
 */
export async function verifyPasswordTimingSafe(plain: string): Promise<false> {
  await bcrypt.compare(plain, DUMMY_HASH);
  return false;
}

// NIST 800-63B leans on length over composition. We require length + a soft
// composition check (at least 3 of 4 classes) and ban a small block-list of
// the worst offenders. Anything stricter pushes users into predictable
// patterns ("Passw0rd!"). For high-value accounts, layer MFA on top.
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "qwerty", "qwerty123", "letmein",
  "welcome", "welcome1", "admin", "admin123", "iloveyou", "monkey", "dragon",
  "abc123", "111111", "123123", "123456", "12345678", "123456789", "1234567890",
  "passw0rd", "p@ssw0rd", "p@ssword",
]);

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), {
    message: "This password is on the common-password block list",
  })
  .refine(
    (v) => {
      const classes = [
        /[a-z]/.test(v),
        /[A-Z]/.test(v),
        /[0-9]/.test(v),
        /[^A-Za-z0-9]/.test(v),
      ].filter(Boolean).length;
      return classes >= 3;
    },
    { message: "Use at least 3 of: lowercase, uppercase, digit, symbol" },
  );

export type PasswordValue = z.infer<typeof passwordSchema>;
