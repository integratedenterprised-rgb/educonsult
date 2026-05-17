/** Shared labels + Tailwind class maps for the lead admin screens. */

export const LEAD_STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CONSULTATION_BOOKED: "Consult booked",
  CONSULTATION_DONE: "Consult done",
  APPLICATION_STARTED: "Application started",
  APPLICATION_SUBMITTED: "Application submitted",
  OFFER_RECEIVED: "Offer received",
  VISA_APPLIED: "Visa applied",
  VISA_GRANTED: "Visa granted",
  ENROLLED: "Enrolled",
  LOST: "Lost",
  DROPPED: "Dropped",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-900",
  CONTACTED: "bg-indigo-100 text-indigo-900",
  QUALIFIED: "bg-violet-100 text-violet-900",
  IN_PROGRESS: "bg-amber-100 text-amber-900",
  WON: "bg-emerald-100 text-emerald-900",
  LOST: "bg-rose-100 text-rose-900",
};

export const LEAD_TEMP_COLORS: Record<string, string> = {
  HOT: "bg-rose-100 text-rose-900",
  WARM: "bg-amber-100 text-amber-900",
  COLD: "bg-sky-100 text-sky-900",
};

export const LEAD_PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-rose-100 text-rose-900",
  HIGH: "bg-amber-100 text-amber-900",
  NORMAL: "bg-zinc-100 text-zinc-700",
  LOW: "bg-zinc-50 text-zinc-500",
};

export const LEAD_STAGES = [
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
] as const;
