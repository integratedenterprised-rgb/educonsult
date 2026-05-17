/**
 * Lead validators.
 *
 * One module covers:
 *   - public intake (one schema per source)
 *   - admin CRUD (status/stage moves, notes, follow-ups, tags, bulk ops)
 *   - list-page query string (filters + pagination + export)
 *
 * Public-intake schemas are intentionally lenient on the optional fields —
 * marketing pages drop fields as we run experiments and we don't want a stale
 * form spec to 4xx. The required floor is contact reachability: at minimum a
 * name plus *one* of email / phone.
 */
import { z } from "zod";

// ── Shared primitives ──────────────────────────────────────────────────────

export const leadSourceSchema = z.enum([
  "ELIGIBILITY_FORM",
  "VISA_RISK_FORM",
  "CONSULTATION_FORM",
  "RESOURCE_DOWNLOAD",
  "CONTACT_FORM",
  "NEWSLETTER",
  "CHAT_WIDGET",
  "PHONE_CALL",
  "WALK_IN",
  "REFERRAL",
  "AGENT",
  "EVENT",
  "MANUAL_ENTRY",
  "IMPORT",
  "OTHER",
]);
export type LeadSourceValue = z.infer<typeof leadSourceSchema>;

export const leadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "IN_PROGRESS",
  "WON",
  "LOST",
]);
export type LeadStatusValue = z.infer<typeof leadStatusSchema>;

export const leadStageSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONSULTATION_BOOKED",
  "CONSULTATION_DONE",
  "APPLICATION_STARTED",
  "APPLICATION_SUBMITTED",
  "OFFER_RECEIVED",
  "VISA_APPLIED",
  "VISA_GRANTED",
  "ENROLLED",
  "LOST",
  "DROPPED",
]);
export type LeadStageValue = z.infer<typeof leadStageSchema>;

export const leadTemperatureSchema = z.enum(["HOT", "WARM", "COLD"]);
export const leadPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
export const followUpChannelSchema = z.enum([
  "CALL",
  "EMAIL",
  "WHATSAPP",
  "SMS",
  "MEETING",
  "VIDEO_CALL",
  "OTHER",
]);
export const followUpStatusSchema = z.enum([
  "PENDING",
  "COMPLETED",
  "MISSED",
  "CANCELLED",
]);

// Loose phone validator. We reject obvious garbage but don't enforce E.164
// because the form serves users from Nepal/India/Bhutan with mixed formats.
const phoneSchema = z
  .string()
  .trim()
  .min(6, "Phone number is too short")
  .max(24, "Phone number is too long")
  .regex(/^[+()0-9\s-]+$/, "Phone may only contain digits, spaces, + ( ) and -");

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");
const optionalEmail = emailSchema.optional().nullable().or(z.literal(""));
const optionalPhone = phoneSchema.optional().nullable().or(z.literal(""));
const optionalStr = (max = 200) => z.string().trim().max(max).optional().nullable();

// Shared baseline fields every public intake includes. Spread into each
// per-source object so `discriminatedUnion` (which requires pure ZodObjects)
// works without intersection types.
const publicLeadBaseShape = {
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: optionalStr(80),
  email: optionalEmail,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  countryCode: optionalStr(2),
  preferredIntake: optionalStr(60),
  sourceUrl: optionalStr(500),
  referrerUrl: optionalStr(500),
  utmSource: optionalStr(120),
  utmMedium: optionalStr(120),
  utmCampaign: optionalStr(120),
  utmTerm: optionalStr(120),
  utmContent: optionalStr(120),
  locale: z.enum(["EN", "NE", "HI", "ZH"]).optional(),
} as const;

const reachable = (v: { email?: string | null; phone?: string | null }) =>
  Boolean(v.email) || Boolean(v.phone);
const reachableMsg = {
  message: "Provide either an email or a phone number",
  path: ["email"],
};

// ── Public intake — one schema per source ──────────────────────────────────

export const eligibilityLeadSchema = z
  .object({
    ...publicLeadBaseShape,
    source: z.literal("ELIGIBILITY_FORM"),
    gpa: z.number().min(0).max(10).optional(),
    ielts: z.number().min(0).max(9).optional(),
    toefl: z.number().min(0).max(120).optional(),
    pte: z.number().min(0).max(90).optional(),
    duolingo: z.number().min(0).max(160).optional(),
    educationLevel: optionalStr(60), // "Bachelors", "12th", …
    fieldOfStudy: optionalStr(120),
    workExperienceYears: z.number().min(0).max(40).optional(),
    budgetUsd: z.number().int().min(0).max(1_000_000).optional(),
    extras: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(reachable, reachableMsg);
export type EligibilityLeadInput = z.infer<typeof eligibilityLeadSchema>;

export const visaRiskLeadSchema = z
  .object({
    ...publicLeadBaseShape,
    source: z.literal("VISA_RISK_FORM"),
    answers: z.record(z.string(), z.unknown()),
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    riskScore: z.number().int().min(0).max(100).optional(),
    triggeredRules: z.array(z.string()).optional(),
  })
  .refine(reachable, reachableMsg);
export type VisaRiskLeadInput = z.infer<typeof visaRiskLeadSchema>;

export const consultationLeadSchema = z
  .object({
    ...publicLeadBaseShape,
    source: z.literal("CONSULTATION_FORM"),
    preferredAt: z.coerce.date().optional(),
    channel: z.enum(["IN_PERSON", "PHONE", "VIDEO_CALL"]).optional(),
    topic: optionalStr(200),
    message: optionalStr(2000),
  })
  .refine(reachable, reachableMsg);
export type ConsultationLeadInput = z.infer<typeof consultationLeadSchema>;

export const resourceDownloadLeadSchema = z
  .object({
    ...publicLeadBaseShape,
    source: z.literal("RESOURCE_DOWNLOAD"),
    resourceId: z.string().min(1, "resourceId is required"),
    consentMarketing: z.boolean().default(false),
  })
  .refine(reachable, reachableMsg);
export type ResourceDownloadLeadInput = z.infer<typeof resourceDownloadLeadSchema>;

// Discriminator pre-parse — strip the refine() wrappers so the union picks
// the right leaf by `source`, then the leaf's own refine catches reachability.
const eligibilityInner = z.object({ ...publicLeadBaseShape, source: z.literal("ELIGIBILITY_FORM") }).passthrough();
const visaRiskInner = z.object({ ...publicLeadBaseShape, source: z.literal("VISA_RISK_FORM") }).passthrough();
const consultationInner = z.object({ ...publicLeadBaseShape, source: z.literal("CONSULTATION_FORM") }).passthrough();
const resourceInner = z.object({ ...publicLeadBaseShape, source: z.literal("RESOURCE_DOWNLOAD") }).passthrough();

export const publicLeadDiscriminator = z.discriminatedUnion("source", [
  eligibilityInner,
  visaRiskInner,
  consultationInner,
  resourceInner,
]);

export type PublicLeadInput =
  | EligibilityLeadInput
  | VisaRiskLeadInput
  | ConsultationLeadInput
  | ResourceDownloadLeadInput;

/** Route entry: discriminate on `source`, then parse with the strict leaf. */
export function parsePublicLead(payload: unknown):
  | { ok: true; data: PublicLeadInput }
  | { ok: false; error: z.ZodError } {
  const disc = publicLeadDiscriminator.safeParse(payload);
  if (!disc.success) return { ok: false, error: disc.error };
  switch (disc.data.source) {
    case "ELIGIBILITY_FORM": {
      const r = eligibilityLeadSchema.safeParse(payload);
      return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
    }
    case "VISA_RISK_FORM": {
      const r = visaRiskLeadSchema.safeParse(payload);
      return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
    }
    case "CONSULTATION_FORM": {
      const r = consultationLeadSchema.safeParse(payload);
      return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
    }
    case "RESOURCE_DOWNLOAD": {
      const r = resourceDownloadLeadSchema.safeParse(payload);
      return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
    }
  }
}

// ── Admin ──────────────────────────────────────────────────────────────────

export const leadCreateSchema = z.object({
  source: leadSourceSchema.default("MANUAL_ENTRY"),
  firstName: z.string().trim().min(1).max(80),
  lastName: optionalStr(80),
  email: optionalEmail,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  countryCode: optionalStr(2),
  preferredIntake: optionalStr(60),
  budgetUsd: z.number().int().min(0).optional().nullable(),
  ielts: z.number().min(0).max(9).optional().nullable(),
  gpa: z.number().min(0).max(10).optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  priority: leadPrioritySchema.optional(),
  tagIds: z.array(z.string()).optional(),
  initialNote: optionalStr(4000),
  data: z.record(z.string(), z.unknown()).optional(),
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const leadUpdateSchema = leadCreateSchema.partial().extend({
  status: leadStatusSchema.optional(),
  stage: leadStageSchema.optional(),
  temperature: leadTemperatureSchema.optional(),
  closeReason: optionalStr(200),
});
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export const leadAssignSchema = z.object({
  assignedToId: z.string().nullable(),
  reason: optionalStr(200),
});
export type LeadAssignInput = z.infer<typeof leadAssignSchema>;

export const leadStatusChangeSchema = z.object({
  status: leadStatusSchema.optional(),
  stage: leadStageSchema.optional(),
  closeReason: optionalStr(200),
}).refine((v) => v.status || v.stage, { message: "Provide status or stage" });
export type LeadStatusChangeInput = z.infer<typeof leadStatusChangeSchema>;

export const leadNoteCreateSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(8000),
  isPinned: z.boolean().optional().default(false),
});
export type LeadNoteCreateInput = z.infer<typeof leadNoteCreateSchema>;

export const leadFollowUpCreateSchema = z.object({
  channel: followUpChannelSchema,
  dueAt: z.coerce.date(),
  notes: optionalStr(2000),
  assignedToId: z.string().optional().nullable(),
});
export type LeadFollowUpCreateInput = z.infer<typeof leadFollowUpCreateSchema>;

export const leadFollowUpUpdateSchema = z.object({
  status: followUpStatusSchema.optional(),
  outcome: optionalStr(2000),
  dueAt: z.coerce.date().optional(),
  notes: optionalStr(2000),
});
export type LeadFollowUpUpdateInput = z.infer<typeof leadFollowUpUpdateSchema>;

export const leadTagUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  label: z.string().trim().min(1).max(80),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex")
    .optional()
    .nullable(),
});
export type LeadTagUpsertInput = z.infer<typeof leadTagUpsertSchema>;

export const leadTagsSetSchema = z.object({
  tagIds: z.array(z.string()).default([]),
});

export const leadBulkActionSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.enum(["assign", "status", "stage", "addTag", "removeTag", "delete"]),
  assignedToId: z.string().optional().nullable(),
  status: leadStatusSchema.optional(),
  stage: leadStageSchema.optional(),
  tagId: z.string().optional(),
});
export type LeadBulkActionInput = z.infer<typeof leadBulkActionSchema>;

// ── List query (admin list page + CSV export) ─────────────────────────────

export const LEAD_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "score",
  "lastContactedAt",
  "nextFollowUpAt",
] as const;
export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number];

export const leadListQuerySchema = z.object({
  query: z.string().trim().optional(),
  source: leadSourceSchema.optional(),
  status: leadStatusSchema.optional(),
  stage: leadStageSchema.optional(),
  temperature: leadTemperatureSchema.optional(),
  priority: leadPrioritySchema.optional(),
  assignedToId: z.string().optional(),
  tagId: z.string().optional(),
  countryCode: z.string().length(2).optional(),
  unassigned: z.coerce.boolean().optional(),
  overdueFollowUp: z.coerce.boolean().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  sort: z.enum(LEAD_SORT_FIELDS).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
});
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
