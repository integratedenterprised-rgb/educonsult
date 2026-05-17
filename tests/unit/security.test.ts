/**
 * Security primitives — sanitizer + rate limiter + password schema.
 *
 * The sanitizer is the line that stops stored XSS; tests must pin the
 * exact tags/attributes we strip, the link-attribute hardening, and the
 * recursive section traversal.
 */
import { describe, expect, it } from "vitest";
import {
  sanitizeRichHtml,
  sanitizeText,
  sanitizeSectionsHtml,
  sanitizeJsonText,
} from "@/lib/security/sanitize";
import { passwordSchema } from "@/lib/security/password";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("sanitizeRichHtml", () => {
  it("strips script tags entirely", () => {
    const out = sanitizeRichHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toContain("script");
    expect(out).toContain("hi");
  });

  it("strips inline event handlers", () => {
    const out = sanitizeRichHtml('<p onclick="alert(1)">hi</p>');
    expect(out).not.toContain("onclick");
  });

  it("rejects javascript: URLs on anchors", () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("rejects data: URLs on anchors", () => {
    const out = sanitizeRichHtml('<a href="data:text/html,<script>1</script>">x</a>');
    expect(out).not.toMatch(/data:/i);
  });

  it("adds rel=noopener noreferrer to target=_blank anchors", () => {
    const out = sanitizeRichHtml('<a href="https://example.com" target="_blank">x</a>');
    expect(out).toMatch(/rel="[^"]*noopener[^"]*"/);
    expect(out).toMatch(/rel="[^"]*noreferrer[^"]*"/);
  });

  it("preserves safe formatting", () => {
    const html = '<p><strong>bold</strong> and <em>italic</em> with <a href="https://example.com">link</a></p>';
    const out = sanitizeRichHtml(html);
    expect(out).toContain("<strong>");
    expect(out).toContain("<em>");
    expect(out).toContain('href="https://example.com"');
  });
});

describe("sanitizeText", () => {
  it("strips all tags and collapses whitespace", () => {
    expect(sanitizeText("<b>hello</b>   <i>world</i>")).toBe("hello world");
  });

  it("returns empty string for null/undefined", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
  });
});

describe("sanitizeSectionsHtml", () => {
  it("sanitizes only richText sections", () => {
    const sections = [
      { id: "1", type: "hero", data: { title: "Hi" } },
      { id: "2", type: "richText", data: { html: '<p>safe</p><script>bad</script>' } },
      { id: "3", type: "cta", data: { heading: "<script>" } },
    ];
    const out = sanitizeSectionsHtml(sections) as typeof sections;
    expect(out[0]).toEqual(sections[0]);
    expect((out[1]!.data as { html: string }).html).not.toContain("script");
    // Non-richText sections pass through unchanged — they have their own
    // schema-driven sanitization needs at the field level.
    expect(out[2]).toEqual(sections[2]);
  });

  it("returns non-array input unchanged", () => {
    expect(sanitizeSectionsHtml(null)).toBe(null);
    expect(sanitizeSectionsHtml({ not: "array" })).toEqual({ not: "array" });
  });
});

describe("sanitizeJsonText", () => {
  it("recursively scrubs HTML from string leaves", () => {
    const out = sanitizeJsonText({
      message: "<script>alert(1)</script>hi",
      nested: { items: ["<b>x</b>", "<i>y</i>"] },
      count: 3,
      enabled: true,
    });
    expect(out.message).toBe("hi");
    expect(out.nested.items).toEqual(["x", "y"]);
    expect(out.count).toBe(3);
    expect(out.enabled).toBe(true);
  });
});

describe("passwordSchema", () => {
  it("rejects short passwords", () => {
    expect(passwordSchema.safeParse("Sh0rt!").success).toBe(false);
  });

  it("rejects passwords on the common-password block list", () => {
    expect(passwordSchema.safeParse("Password123!").success).toBe(true); // not on list
    expect(passwordSchema.safeParse("password123").success).toBe(false);
    expect(passwordSchema.safeParse("PASSWORD123").success).toBe(false);
  });

  it("requires at least 3 character classes", () => {
    expect(passwordSchema.safeParse("alllowercaseletter").success).toBe(false);
    expect(passwordSchema.safeParse("MixedCaseAndDigits1").success).toBe(true);
    expect(passwordSchema.safeParse("FullEntropy1!aaaa").success).toBe(true);
  });
});

describe("checkRateLimit", () => {
  it("admits up to `limit` requests within the window", async () => {
    const key = `vitest:rl:admit:${Math.random()}`;
    const opts = { key, limit: 3, windowMs: 60_000 };
    expect((await checkRateLimit(opts)).ok).toBe(true);
    expect((await checkRateLimit(opts)).ok).toBe(true);
    expect((await checkRateLimit(opts)).ok).toBe(true);
    const fourth = await checkRateLimit(opts);
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it("each key is independent", async () => {
    const k1 = `vitest:rl:a:${Math.random()}`;
    const k2 = `vitest:rl:b:${Math.random()}`;
    await checkRateLimit({ key: k1, limit: 1, windowMs: 60_000 });
    expect((await checkRateLimit({ key: k2, limit: 1, windowMs: 60_000 })).ok).toBe(true);
  });
});
