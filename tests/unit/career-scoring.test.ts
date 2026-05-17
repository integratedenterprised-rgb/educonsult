/**
 * Career-engine scoring — pure dimension scorers + combine.
 *
 * These pin the user-visible heuristics so a refactor (e.g. tuning the
 * salary-ratio cutoffs) doesn't silently shift recommendations for every
 * applicant.
 */
import { describe, expect, it } from "vitest";
import {
  scoreInterest,
  scoreCountry,
  scoreDemand,
  scorePr,
  scoreSalary,
  scoreBudget,
  scoreAll,
  combineScores,
  type CandidateSnapshot,
  type DimensionScores,
} from "@/server/career/scoring";
import type { CareerProfile } from "@/server/career/dsl";

const baseSnapshot: CandidateSnapshot = {
  courseId: "course-1",
  countryId: "country-au",
  countryCode: "AU",
  courseField: "Computer Science",
  courseDiscipline: "STEM",
  courseLevel: "MASTERS",
  courseDurationMonths: 18,
  outcomes: ["software engineer", "data analyst"],
  avgTuitionUsd: 30000,
  livingCostUsd: 15000,
  prEligible: true,
  graduateVisaMonths: 24,
  bestPrDifficulty: "MODERATE",
  demandLevel: "HIGH",
  shortageListed: true,
  midSalaryUsd: 80000,
};

describe("scoreInterest", () => {
  it("matches on field keyword", () => {
    const profile: CareerProfile = { interestedFields: ["computer"] };
    expect(scoreInterest(profile, baseSnapshot)).toBe(1);
  });

  it("matches on occupation keyword", () => {
    const profile: CareerProfile = { interestedOccupations: ["software"] };
    expect(scoreInterest(profile, baseSnapshot)).toBe(1);
  });

  it("returns neutral 0.6 when no preferences", () => {
    expect(scoreInterest({}, baseSnapshot)).toBe(0.6);
  });

  it("scales partial matches by hit ratio", () => {
    const profile: CareerProfile = {
      interestedFields: ["physics"], // miss
      interestedOccupations: ["software"], // hit
    };
    const s = scoreInterest(profile, baseSnapshot);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });
});

describe("scoreCountry", () => {
  it("returns 1.0 for a preferred country", () => {
    expect(scoreCountry({ preferredCountries: ["AU", "CA"] }, baseSnapshot)).toBe(1);
  });

  it("returns 0.3 for an unpreferred country", () => {
    expect(scoreCountry({ preferredCountries: ["UK"] }, baseSnapshot)).toBe(0.3);
  });

  it("neutral when no preference is given", () => {
    expect(scoreCountry({}, baseSnapshot)).toBe(0.6);
  });
});

describe("scoreDemand", () => {
  it("rewards shortage-listed candidates", () => {
    const withList = scoreDemand(baseSnapshot);
    const without = scoreDemand({ ...baseSnapshot, shortageListed: false });
    expect(withList).toBeGreaterThan(without);
  });

  it("returns mid value when demand is unknown", () => {
    expect(scoreDemand({ ...baseSnapshot, demandLevel: null, shortageListed: false })).toBeLessThan(0.6);
  });
});

describe("scorePr", () => {
  it("rewards PR-eligible candidates when PR is a goal", () => {
    const profile: CareerProfile = { prGoalWeight: 1 };
    expect(scorePr(profile, baseSnapshot)).toBeGreaterThanOrEqual(0.5);
  });

  it("non-eligible PR scores low when PR is desired", () => {
    const profile: CareerProfile = { prGoalWeight: 1 };
    expect(scorePr(profile, { ...baseSnapshot, prEligible: false })).toBeLessThan(0.2);
  });

  it("returns a neutral 0.5 when PR weight is zero — no penalty", () => {
    expect(scorePr({ prGoalWeight: 0 }, { ...baseSnapshot, prEligible: false })).toBe(0.5);
  });
});

describe("scoreSalary", () => {
  it("returns 1.0 when mid salary is ≥ 1.2× the country target", () => {
    const generous: CandidateSnapshot = { ...baseSnapshot, midSalaryUsd: 200_000 };
    expect(scoreSalary(generous)).toBe(1);
  });

  it("returns 0 when mid salary is ≤ 0.4× the country target", () => {
    const slim: CandidateSnapshot = { ...baseSnapshot, midSalaryUsd: 1000 };
    expect(scoreSalary(slim)).toBe(0);
  });

  it("returns 0.5 when no salary data is available", () => {
    expect(scoreSalary({ ...baseSnapshot, midSalaryUsd: null })).toBe(0.5);
  });
});

describe("scoreBudget", () => {
  it("higher budget than course cost is a positive signal", () => {
    const big = scoreBudget({ budgetUsd: 80_000 }, baseSnapshot);
    const tight = scoreBudget({ budgetUsd: 10_000 }, baseSnapshot);
    expect(big).toBeGreaterThan(tight);
  });
});

describe("combineScores", () => {
  const dims: DimensionScores = {
    interest: 1,
    country: 1,
    demand: 1,
    pr: 1,
    salary: 1,
    budget: 1,
  };

  it("returns 100 when every dimension is 1 and weights are non-zero", () => {
    const weights = { interest: 1, country: 1, demand: 1, pr: 1, salary: 1, budget: 1 };
    expect(combineScores(dims, weights)).toBe(100);
  });

  it("returns 0 when all weights sum to zero (degenerate config)", () => {
    const weights = { interest: 0, country: 0, demand: 0, pr: 0, salary: 0, budget: 0 };
    expect(combineScores(dims, weights)).toBe(0);
  });

  it("respects weight asymmetry", () => {
    const lopsided: DimensionScores = { ...dims, interest: 0 };
    const weights = { interest: 10, country: 1, demand: 1, pr: 1, salary: 1, budget: 1 };
    // interest=0 with weight 10 should dominate downwards.
    expect(combineScores(lopsided, weights)).toBeLessThan(70);
  });
});

describe("scoreAll integration", () => {
  it("produces every dimension key", () => {
    const profile: CareerProfile = {
      interestedFields: ["computer"],
      preferredCountries: ["AU"],
      prGoalWeight: 0.5,
      budgetUsd: 50_000,
    };
    const out = scoreAll(profile, baseSnapshot);
    expect(Object.keys(out).sort()).toEqual(
      ["budget", "country", "demand", "interest", "pr", "salary"],
    );
    for (const v of Object.values(out)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
