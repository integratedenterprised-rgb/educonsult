import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Vitest is wired only for *pure* server-side logic — engines, scoring,
 * validators, and helpers under `src/lib/` and `src/server/` that don't
 * need a database. Integration tests that exercise Prisma + the dev
 * Postgres should live in a separate suite (`tests/integration/`) so the
 * fast suite stays fast.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/unit/**/*.{test,spec}.ts"],
    exclude: ["node_modules", ".next", "tests/integration/**"],
    globals: false,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/server/leads/scoring.ts",
        "src/server/career/**/*.ts",
        "src/server/visa-risk/**/*.ts",
        "src/lib/security/**/*.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "server-only": resolve(__dirname, "./tests/shims/server-only.ts"),
    },
  },
});
