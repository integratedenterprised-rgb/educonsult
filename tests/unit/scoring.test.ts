/**
 * Lead scoring engine — pure function tests.
 *
 * These pin the high-value, behaviour-shaping rules:
 *  - Source weight dominates the base
 *  - Multi-channel reachability is additive
 *  - Visa-risk raises *priority* but not the *score*
 *  - High-intent inputs reach HOT temperature; sparse inputs stay COLD
 */
import { describe, expect, it } from "vitest";
import { scoreLead } from "@/server/leads/scoring";

describe("scoreLead — base source weighting", () => {
  it("CONSULTATION_FORM scores highest among public sources", () => {
    const consult = scoreLead({ source: "CONSULTATION_FORM" });
    const eligibility = scoreLead({ source: "ELIGIBILITY_FORM" });
    const download = scoreLead({ source: "RESOURCE_DOWNLOAD" });
    expect(consult.score).toBeGreaterThan(eligibility.score);
    expect(eligibility.score).toBeGreaterThan(download.score);
  });

  it("unknown sources fall through to a sane default", () => {
    // OTHER is the catch-all bucket.
    const r = scoreLead({ source: "OTHER" });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe("scoreLead — signals", () => {
  it("multi-channel reachability adds to the score", () => {
    const phoneOnly = scoreLead({ source: "ELIGIBILITY_FORM", phone: "+9779800000000" });
    const both = scoreLead({
      source: "ELIGIBILITY_FORM",
      phone: "+9779800000000",
      email: "test@example.com",
    });
    expect(both.score).toBeGreaterThan(phoneOnly.score);
  });

  it("strong English + high GPA push temperature toward HOT", () => {
    const r = scoreLead({
      source: "CONSULTATION_FORM",
      email: "x@y.com",
      phone: "+977",
      countryCode: "AU",
      preferredIntake: "Spring 2026",
      preferredAt: new Date(),
      budgetUsd: 40_000,
      ielts: 7.5,
      gpa: 3.8,
    });
    expect(r.score).toBeGreaterThan(80);
    expect(r.temperature).toBe("HOT");
  });

  it("a bare resource download stays COLD/WARM", () => {
    const r = scoreLead({ source: "RESOURCE_DOWNLOAD" });
    expect(["COLD", "WARM"]).toContain(r.temperature);
  });
});

describe("scoreLead — visa risk", () => {
  it("HIGH visa risk subtracts only a small amount — never dumps a lead", () => {
    const baseline = scoreLead({
      source: "VISA_RISK_FORM",
      email: "x@y.com",
      ielts: 6.5,
      gpa: 3.2,
    });
    const risky = scoreLead({
      source: "VISA_RISK_FORM",
      email: "x@y.com",
      ielts: 6.5,
      gpa: 3.2,
      visaRiskLevel: "HIGH",
      visaRiskScore: 70,
    });
    // The actual policy: HIGH = -2, CRITICAL = -4. The point is that visa
    // risk shouldn't drop a HOT lead to COLD — small adjustment only.
    expect(baseline.score - risky.score).toBeLessThanOrEqual(5);
  });

  it("LOW visa risk is a positive signal", () => {
    const baseline = scoreLead({ source: "VISA_RISK_FORM", email: "x@y.com" });
    const safe = scoreLead({
      source: "VISA_RISK_FORM",
      email: "x@y.com",
      visaRiskLevel: "LOW",
      visaRiskScore: 10,
    });
    expect(safe.score).toBeGreaterThan(baseline.score);
  });

  it("CRITICAL visa risk surfaces as elevated priority", () => {
    const r = scoreLead({
      source: "VISA_RISK_FORM",
      email: "x@y.com",
      visaRiskLevel: "CRITICAL",
      visaRiskScore: 90,
    });
    expect(["HIGH", "URGENT"]).toContain(r.priority);
  });
});

describe("scoreLead — breakdown integrity", () => {
  it("breakdown sums (approximately) to the final score, clipped to 0..100", () => {
    const r = scoreLead({
      source: "CONSULTATION_FORM",
      email: "x@y.com",
      phone: "+977",
      ielts: 7,
      gpa: 3.6,
    });
    const sum = r.breakdown.reduce((acc, c) => acc + c.delta, 0);
    expect(r.score).toBe(Math.max(0, Math.min(100, sum)));
  });

  it("every contribution carries a reason string", () => {
    const r = scoreLead({ source: "ELIGIBILITY_FORM", email: "x@y.com" });
    for (const c of r.breakdown) {
      expect(c.reason).toBeTruthy();
      expect(typeof c.reason).toBe("string");
    }
  });
});
