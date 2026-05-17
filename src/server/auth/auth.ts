/**
 * NextAuth (Auth.js v5) bootstrap.
 *
 * Providers:
 *  - Credentials (email + password) — bcrypt-hashed, stored on the User row.
 *  - Email (magic link) — only enabled when SMTP envs are present.
 *
 * Session strategy is JWT so the middleware can validate the token without
 * a DB hit on every request. We still store user/account rows via the Prisma
 * adapter so future OAuth providers can be added without a migration.
 *
 * Hardening (see `src/lib/security/`):
 *  - Account lockout after N failed attempts; window-based reset.
 *  - Per-IP rate-limit gate before bcrypt to bound CPU under credential
 *    stuffing.
 *  - Constant-time response on missing/inactive users (DUMMY_HASH compare)
 *    closes the email-enumeration timing channel.
 *  - `passwordChangedAt` / `sessionsInvalidAt` on the user invalidate
 *    previously-minted JWTs without an account.session table lookup.
 *  - Every success/failure writes an AuditLog row.
 */
import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";
import type { UserRole } from "@prisma/client";
import { headers } from "next/headers";
import {
  verifyPassword,
  verifyPasswordTimingSafe,
} from "@/lib/security/password";
import { checkRateLimit, RateLimitPolicy } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/ip";
import { logAudit } from "@/server/audit/audit";

const emailEnabled = Boolean(
  serverEnv.EMAIL_SERVER_HOST &&
    serverEnv.EMAIL_SERVER_PORT &&
    serverEnv.EMAIL_FROM,
);

/** Lock the account for this long once `MAX_FAILED_ATTEMPTS` is exceeded. */
const LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Read request envelope for audit. NextAuth's authorize() does not pass the
 * Request, so we pull from Next's `headers()` helper (available in route
 * handlers + server actions, which is where authorize is invoked from).
 */
async function authContext() {
  try {
    const h = await headers();
    return { ip: getClientIp(h), userAgent: h.get("user-agent") };
  } catch {
    return { ip: "unknown", userAgent: null };
  }
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: serverEnv.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Host-authjs.csrf-token"
        : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = typeof creds?.email === "string" ? creds.email.toLowerCase().trim() : "";
        const password = typeof creds?.password === "string" ? creds.password : "";
        const ctx = await authContext();

        if (!email || !password) {
          await logAudit({
            action: "LOGIN_FAILURE",
            status: "FAILURE",
            actorEmail: email || null,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
            metadata: { reason: "missing-credentials" },
          });
          return null;
        }

        // Per-IP rate limit gate (before any DB / bcrypt work) so credential
        // stuffing can't burn CPU.
        const rl = await checkRateLimit({
          key: `login:ip:${ctx.ip}`,
          ...RateLimitPolicy.login,
        });
        if (!rl.ok) {
          await logAudit({
            action: "LOGIN_FAILURE",
            status: "FAILURE",
            actorEmail: email,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
            metadata: { reason: "rate-limited" },
          });
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Missing/inactive/deleted/no-password — burn the same CPU as a real
        // bcrypt compare so an attacker can't distinguish by response time.
        if (!user || !user.passwordHash || !user.isActive || user.deletedAt) {
          await verifyPasswordTimingSafe(password);
          await logAudit({
            action: "LOGIN_FAILURE",
            status: "FAILURE",
            actorEmail: email,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
            metadata: {
              reason: !user ? "no-such-user" : !user.isActive ? "inactive" : user.deletedAt ? "deleted" : "no-password",
            },
          });
          return null;
        }

        // Account-level lockout (separate from IP rate-limit so a single
        // account can't be locked from many IPs in turn).
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await logAudit({
            action: "LOGIN_LOCKED",
            status: "FAILURE",
            actorId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
            metadata: { lockedUntil: user.lockedUntil.toISOString() },
          });
          await verifyPasswordTimingSafe(password);
          return null;
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          const attempts = user.failedLoginAttempts + 1;
          const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
            },
          });
          await logAudit({
            action: shouldLock ? "LOGIN_LOCKED" : "LOGIN_FAILURE",
            status: "FAILURE",
            actorId: user.id,
            actorEmail: user.email,
            actorRole: user.role,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
            metadata: { reason: "bad-password", attempts },
          });
          return null;
        }

        // Success — reset counters, stamp login time.
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
        await logAudit({
          action: "LOGIN_SUCCESS",
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(emailEnabled
      ? [
          Email({
            server: {
              host: serverEnv.EMAIL_SERVER_HOST!,
              port: Number(serverEnv.EMAIL_SERVER_PORT!),
              auth: serverEnv.EMAIL_SERVER_USER
                ? {
                    user: serverEnv.EMAIL_SERVER_USER,
                    pass: serverEnv.EMAIL_SERVER_PASSWORD ?? "",
                  }
                : undefined,
            },
            from: serverEnv.EMAIL_FROM!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: UserRole }).role ?? "EDITOR";
        token.iat = Math.floor(Date.now() / 1000);
        return token;
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            isActive: true,
            deletedAt: true,
            passwordChangedAt: true,
            sessionsInvalidAt: true,
          },
        });
        if (!dbUser || !dbUser.isActive || dbUser.deletedAt) return {};

        // Invalidate JWTs minted before a password change or session
        // revocation. `token.iat` is seconds-since-epoch.
        const iat = typeof token.iat === "number" ? token.iat : 0;
        const cutoffs = [dbUser.passwordChangedAt, dbUser.sessionsInvalidAt]
          .filter((d): d is Date => !!d)
          .map((d) => Math.floor(d.getTime() / 1000));
        const watermark = cutoffs.length ? Math.max(...cutoffs) : 0;
        if (watermark > 0 && iat < watermark) return {};

        token.role = dbUser.role;
      }
      if (trigger === "update") {
        token.iat = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) ?? "VIEWER";
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = (message as { token?: { id?: string; email?: string } }).token;
      if (!token?.id) return;
      const ctx = await authContext();
      await logAudit({
        action: "LOGOUT",
        actorId: token.id,
        actorEmail: token.email ?? null,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
