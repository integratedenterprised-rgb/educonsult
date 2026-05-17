/**
 * Runtime environment validation.
 *
 * Imported once at server boot via `src/lib/prisma.ts` and re-exported as a
 * frozen, typed object. Any missing or malformed variable crashes the
 * process *before* it serves traffic — a misconfigured deploy never silently
 * falls through to runtime errors.
 */
import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  SHADOW_DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.string().optional(),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  // S3-compatible media store
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_PUBLIC_URL_BASE: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  REVALIDATE_SECRET: z.string().optional(),
  // Security knobs — all optional; sensible defaults at call sites.
  ALLOWED_ORIGINS: z.string().optional(),
  CSP_REPORT_URI: z.string().url().optional().or(z.literal("")),
  CSP_EXTRA_SCRIPT_SRC: z.string().optional(),
  CSP_EXTRA_STYLE_SRC: z.string().optional(),
  CSP_EXTRA_CONNECT_SRC: z.string().optional(),
  CSP_EXTRA_IMG_SRC: z.string().optional(),
  CSP_EXTRA_FRAME_SRC: z.string().optional(),
  TRUSTED_PROXY_HOPS: z.string().regex(/^\d+$/).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["en", "ne"]).default("en"),
  NEXT_PUBLIC_GA_ID: z.string().optional().or(z.literal("")),
});

const clientRaw = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
};

function parse<T extends z.ZodType>(schema: T, raw: Record<string, unknown>, scope: string) {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error(`❌ Invalid ${scope} environment variables:`, formatted);
    throw new Error(`Invalid ${scope} environment variables`);
  }
  return result.data as z.infer<T>;
}

// Server env is only safe to read on the server; importing it into a client
// component will fail at build time because process.env values aren't inlined.
export const serverEnv =
  typeof window === "undefined" ? parse(serverSchema, process.env, "server") : ({} as z.infer<typeof serverSchema>);

export const clientEnv = parse(clientSchema, clientRaw, "client");

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
