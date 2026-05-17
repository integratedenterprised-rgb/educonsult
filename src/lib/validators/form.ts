import { z } from "zod";

const FIELD_TYPES = [
  "TEXT", "EMAIL", "PHONE", "TEXTAREA", "SELECT", "MULTISELECT",
  "CHECKBOX", "RADIO", "DATE", "FILE", "HIDDEN", "COUNTRY_PICKER",
  "COURSE_PICKER", "RICH_TEXT",
] as const;

const fieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Machine name: letters, digits, underscore; must start with letter"),
  type: z.enum(FIELD_TYPES),
  isRequired: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  validation: z.unknown().optional().nullable(),
  options: z.unknown().optional().nullable(),
  conditional: z.unknown().optional().nullable(),
  label: z.string().min(1).max(200),
  placeholder: z.string().max(200).optional().nullable(),
  helpText: z.string().max(500).optional().nullable(),
});

export const formUpsertSchema = z.object({
  key: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  successUrl: z.string().url().optional().nullable().or(z.literal("")),
  webhookUrl: z.string().url().optional().nullable().or(z.literal("")),
  emailTo: z.string().email().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
  heading: z.string().max(200).optional().nullable(),
  subheading: z.string().max(500).optional().nullable(),
  submitLabel: z.string().min(1).max(80).default("Submit"),
  successMessage: z.string().max(500).optional().nullable(),
  fields: z.array(fieldSchema).max(60),
});

export type FormUpsertInput = z.infer<typeof formUpsertSchema>;
