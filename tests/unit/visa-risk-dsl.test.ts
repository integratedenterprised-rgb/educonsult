/**
 * Visa-risk DSL evaluator — pure predicate logic.
 *
 * The evaluator is the critical security/business surface for admin-authored
 * rules. A bad eval here can mis-rate every applicant — every operator and
 * every coercion path needs coverage.
 */
import { describe, expect, it } from "vitest";
import { evaluate, type Predicate, type ApplicantProfile } from "@/server/visa-risk/dsl";

const profile: ApplicantProfile = {
  countryCode: "AU",
  gpa: 3.2,
  gpaScale: 4,
  ielts: 6.0,
  studyGapYears: 2,
  previousVisaRefusals: 1,
  hasIncomeTaxReturn: false,
  age: 23,
};

describe("evaluate — leaf operators", () => {
  it("eq matches exact value", () => {
    const p: Predicate = { kind: "leaf", field: "countryCode", op: "eq", value: "AU" };
    expect(evaluate(p, profile)).toBe(true);
  });

  it("ne is the inverse of eq", () => {
    const p: Predicate = { kind: "leaf", field: "countryCode", op: "ne", value: "CA" };
    expect(evaluate(p, profile)).toBe(true);
  });

  it("lt/lte/gt/gte handle numerics", () => {
    expect(evaluate({ kind: "leaf", field: "ielts", op: "lt", value: 6.5 }, profile)).toBe(true);
    expect(evaluate({ kind: "leaf", field: "ielts", op: "lte", value: 6.0 }, profile)).toBe(true);
    expect(evaluate({ kind: "leaf", field: "ielts", op: "gt", value: 5.5 }, profile)).toBe(true);
    expect(evaluate({ kind: "leaf", field: "ielts", op: "gte", value: 6.0 }, profile)).toBe(true);
    expect(evaluate({ kind: "leaf", field: "ielts", op: "gt", value: 9.0 }, profile)).toBe(false);
  });

  it("in matches against an array", () => {
    const p: Predicate = { kind: "leaf", field: "countryCode", op: "in", value: ["AU", "CA", "UK"] };
    expect(evaluate(p, profile)).toBe(true);
  });

  it("between is inclusive on both ends", () => {
    const inside: Predicate = { kind: "leaf", field: "age", op: "between", value: [18, 30] };
    const outside: Predicate = { kind: "leaf", field: "age", op: "between", value: [30, 40] };
    expect(evaluate(inside, profile)).toBe(true);
    expect(evaluate(outside, profile)).toBe(false);
  });

  it("exists distinguishes null from a real value", () => {
    expect(evaluate({ kind: "leaf", field: "ielts", op: "exists" }, profile)).toBe(true);
    expect(evaluate({ kind: "leaf", field: "toefl", op: "exists" }, profile)).toBe(false);
    expect(evaluate({ kind: "leaf", field: "toefl", op: "notExists" }, profile)).toBe(true);
  });
});

describe("evaluate — composite predicates", () => {
  it("`all` is logical AND", () => {
    const p: Predicate = {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "countryCode", op: "eq", value: "AU" },
        { kind: "leaf", field: "ielts", op: "lt", value: 6.5 },
      ],
    };
    expect(evaluate(p, profile)).toBe(true);
  });

  it("`all` short-circuits on first false", () => {
    const p: Predicate = {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "countryCode", op: "eq", value: "CA" },
        { kind: "leaf", field: "ielts", op: "lt", value: 6.5 },
      ],
    };
    expect(evaluate(p, profile)).toBe(false);
  });

  it("`any` is logical OR", () => {
    const p: Predicate = {
      kind: "any",
      predicates: [
        { kind: "leaf", field: "countryCode", op: "eq", value: "CA" },
        { kind: "leaf", field: "ielts", op: "lt", value: 6.5 },
      ],
    };
    expect(evaluate(p, profile)).toBe(true);
  });

  it("`not` inverts the inner predicate", () => {
    const p: Predicate = {
      kind: "not",
      predicate: { kind: "leaf", field: "countryCode", op: "eq", value: "CA" },
    };
    expect(evaluate(p, profile)).toBe(true);
  });

  it("nested all/any/not composes correctly", () => {
    // (countryCode == AU AND (ielts < 6.5 OR NOT hasIncomeTaxReturn))
    const p: Predicate = {
      kind: "all",
      predicates: [
        { kind: "leaf", field: "countryCode", op: "eq", value: "AU" },
        {
          kind: "any",
          predicates: [
            { kind: "leaf", field: "ielts", op: "lt", value: 6.5 },
            {
              kind: "not",
              predicate: { kind: "leaf", field: "hasIncomeTaxReturn", op: "eq", value: true },
            },
          ],
        },
      ],
    };
    expect(evaluate(p, profile)).toBe(true);
  });
});

describe("evaluate — derived fields", () => {
  it("gpa4 normalizes raw GPA against gpaScale", () => {
    const p: Predicate = { kind: "leaf", field: "gpa4", op: "gte", value: 3.0 };
    expect(evaluate(p, profile)).toBe(true);
    expect(
      evaluate(p, { ...profile, gpa: 7.0, gpaScale: 10 }),
    ).toBe(false);
  });
});
