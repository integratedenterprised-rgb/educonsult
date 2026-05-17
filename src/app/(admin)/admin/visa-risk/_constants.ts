/** Shared labels + Tailwind class maps for the visa-risk admin screens. */

export const RISK_LEVEL_COLORS: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-900",
  MEDIUM: "bg-amber-100 text-amber-900",
  HIGH: "bg-orange-100 text-orange-900",
  CRITICAL: "bg-rose-100 text-rose-900",
};

export const CATEGORY_LABELS: Record<string, string> = {
  academic: "Academic",
  english: "English",
  study_gap: "Study gap",
  financial: "Financial",
  visa_history: "Visa history",
  country: "Country",
  other: "Other",
};

export const OP_LABELS: Record<string, string> = {
  eq: "equals",
  ne: "≠",
  lt: "<",
  lte: "≤",
  gt: ">",
  gte: "≥",
  in: "in [list]",
  between: "between",
  exists: "is set",
  notExists: "is empty",
};
