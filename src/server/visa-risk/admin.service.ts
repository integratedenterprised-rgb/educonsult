/**
 * Admin service for the visa-risk engine.
 *
 * Covers:
 *   - Rule CRUD with translation upsert.
 *   - Soft-delete (matches the rest of the CMS pattern).
 *   - Category weights + risk buckets persisted via SiteSetting.
 *   - `previewAssessment` — synchronous dry-run so admins can test a rule
 *     change against a sample profile before activating.
 */
import "server-only";

import { Prisma, type RiskLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  BucketsInput,
  CategoryWeightsInput,
  RuleUpdateInput,
  RuleUpsertInput,
} from "@/lib/validators/visa-risk";
import { assessWith, loadCategoryWeights, loadRiskBuckets, loadRulesForCountry } from "./engine";
import { DEFAULT_CATEGORY_WEIGHTS } from "./weights";
import type { ApplicantProfile, Predicate } from "./dsl";

// ── Rules ──────────────────────────────────────────────────────────────────

export async function listRules(params: { countryCode?: string | null; isActive?: boolean }) {
  const where: Prisma.VisaRiskRuleWhereInput = {
    deletedAt: null,
    ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
  };
  if (params.countryCode === null) where.countryId = null;
  else if (params.countryCode) {
    const c = await prisma.country.findUnique({
      where: { code: params.countryCode.toUpperCase() },
      select: { id: true },
    });
    if (c) where.OR = [{ countryId: null }, { countryId: c.id }];
  }
  return prisma.visaRiskRule.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    include: {
      country: { select: { code: true } },
      translations: true,
    },
  });
}

export async function getRule(id: string) {
  return prisma.visaRiskRule.findFirst({
    where: { id, deletedAt: null },
    include: {
      country: { select: { code: true } },
      translations: true,
    },
  });
}

export async function createRule(input: RuleUpsertInput) {
  const countryId = await resolveCountryId(input.countryCode);
  return prisma.$transaction(async (tx) => {
    const rule = await tx.visaRiskRule.create({
      data: {
        key: input.key,
        countryId,
        riskLevel: input.riskLevel,
        score: input.score,
        priority: input.priority,
        isActive: input.isActive,
        condition: input.condition as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.visaRiskRuleTranslation.createMany({
      data: input.translations.map((t) => ({
        ruleId: rule.id,
        locale: t.locale,
        label: t.label,
        message: t.message,
        guidance: t.guidance ?? null,
      })),
    });
    return rule;
  });
}

export async function updateRule(id: string, input: RuleUpdateInput) {
  const existing = await prisma.visaRiskRule.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new Error("RULE_NOT_FOUND");

  const countryId =
    input.countryCode === undefined ? existing.countryId : await resolveCountryId(input.countryCode);

  return prisma.$transaction(async (tx) => {
    const rule = await tx.visaRiskRule.update({
      where: { id },
      data: {
        countryId,
        riskLevel: input.riskLevel ?? existing.riskLevel,
        score: input.score ?? existing.score,
        priority: input.priority ?? existing.priority,
        isActive: input.isActive ?? existing.isActive,
        condition:
          input.condition !== undefined
            ? (input.condition as unknown as Prisma.InputJsonValue)
            : (existing.condition as Prisma.InputJsonValue),
      },
    });

    if (input.translations) {
      // Replace-by-locale strategy — simpler than diffing.
      for (const t of input.translations) {
        await tx.visaRiskRuleTranslation.upsert({
          where: { ruleId_locale: { ruleId: rule.id, locale: t.locale } },
          create: {
            ruleId: rule.id,
            locale: t.locale,
            label: t.label,
            message: t.message,
            guidance: t.guidance ?? null,
          },
          update: {
            label: t.label,
            message: t.message,
            guidance: t.guidance ?? null,
          },
        });
      }
    }

    return rule;
  });
}

export async function deleteRule(id: string) {
  await prisma.visaRiskRule.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

async function resolveCountryId(code: string | null | undefined): Promise<string | null> {
  if (!code) return null;
  const c = await prisma.country.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true },
  });
  return c?.id ?? null;
}

// ── Weights + buckets (SiteSetting-backed) ─────────────────────────────────

export async function getWeights() {
  return loadCategoryWeights();
}

export async function setWeights(input: CategoryWeightsInput) {
  await prisma.siteSetting.upsert({
    where: { key: "visa-risk.weights" },
    create: {
      key: "visa-risk.weights",
      group: "engine",
      type: "json",
      value: input as unknown as Prisma.InputJsonValue,
      isPublic: false,
    },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  return input;
}

export async function getBuckets() {
  return loadRiskBuckets();
}

export async function setBuckets(input: BucketsInput) {
  await prisma.siteSetting.upsert({
    where: { key: "visa-risk.buckets" },
    create: {
      key: "visa-risk.buckets",
      group: "engine",
      type: "json",
      value: input as unknown as Prisma.InputJsonValue,
      isPublic: false,
    },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  return input;
}

// ── Preview / dry-run ──────────────────────────────────────────────────────

/**
 * Evaluate a sample profile against the persisted rule set without writing a
 * lead. Used by the admin "test this rule" panel — admins can see which
 * rules trigger before flipping `isActive`.
 */
export async function previewAssessment(profile: ApplicantProfile) {
  const [rules, weights, buckets] = await Promise.all([
    loadRulesForCountry(profile.countryCode ?? null, "EN"),
    loadCategoryWeights(),
    loadRiskBuckets(),
  ]);
  return assessWith(profile, rules, weights, buckets);
}

/**
 * Variant of preview that overlays an in-memory rule on top of the persisted
 * set — useful while authoring a new rule before saving.
 */
export async function previewWithDraft(
  profile: ApplicantProfile,
  draft: {
    key: string;
    riskLevel: RiskLevel;
    score: number;
    condition: Predicate;
    category?: string;
    label?: string;
    message?: string;
    guidance?: string | null;
  },
) {
  const [rules, weights, buckets] = await Promise.all([
    loadRulesForCountry(profile.countryCode ?? null, "EN"),
    loadCategoryWeights(),
    loadRiskBuckets(),
  ]);
  const merged = rules.filter((r) => r.key !== draft.key).concat({
    id: "__draft__",
    key: draft.key,
    countryId: null,
    countryCode: null,
    riskLevel: draft.riskLevel,
    score: draft.score,
    category: (draft.category as keyof typeof DEFAULT_CATEGORY_WEIGHTS) ?? "other",
    priority: 999,
    condition: draft.condition,
    label: draft.label ?? draft.key,
    message: draft.message ?? "",
    guidance: draft.guidance ?? null,
  });
  return assessWith(profile, merged, weights, buckets);
}
