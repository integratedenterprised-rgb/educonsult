/**
 * Notification templates.
 *
 * Templates are inlined here for the bootstrap. Move them to the database
 * (`NotificationTemplate` model + admin editor) once the marketing team needs
 * to edit copy without a deploy. Until then, keep them close to the
 * dispatcher so the rendering rules and shapes evolve together.
 *
 * The body strings are intentionally plain HTML with `{{path.to.value}}`
 * placeholders so a future move to MJML or React-email is mechanical.
 */
import "server-only";

export type LeadTemplateKey =
  | "admin_created"
  | "admin_duplicate"
  | "admin_status"
  | "admin_assigned"
  | "admin_followup"
  | "counsellor_created"
  | "counsellor_assigned"
  | "counsellor_status"
  | "counsellor_followup"
  | "lead_created"
  | "lead_created_whatsapp";

interface Template {
  subject?: string;
  body: string;
}

const TEMPLATES: Record<LeadTemplateKey, Template> = {
  admin_created: {
    subject: "New lead: {{lead.fullName}} ({{lead.source}})",
    body: `<p>A new lead just came in.</p>
<ul>
  <li><b>Name:</b> {{lead.fullName}}</li>
  <li><b>Email:</b> {{lead.email}}</li>
  <li><b>Phone:</b> {{lead.phone}}</li>
  <li><b>Source:</b> {{lead.source}}</li>
  <li><b>Score:</b> {{lead.score}} ({{lead.temperature}})</li>
  <li><b>Country:</b> {{lead.countryCode}}</li>
</ul>
<p><a href="{{siteUrl}}/admin/leads/{{lead.id}}">Open in admin →</a></p>`,
  },
  admin_duplicate: {
    subject: "Repeat submission: {{lead.fullName}}",
    body: `<p>{{lead.fullName}} submitted the {{lead.source}} form again. The existing lead has been updated; no new record was created.</p>
<p><a href="{{siteUrl}}/admin/leads/{{lead.id}}">Open in admin →</a></p>`,
  },
  admin_status: {
    subject: "Status changed: {{lead.fullName}} → {{lead.status}}",
    body: `<p>The lead <b>{{lead.fullName}}</b> moved to <b>{{lead.status}}</b> ({{lead.stage}}).</p>`,
  },
  admin_assigned: {
    subject: "Lead assigned: {{lead.fullName}}",
    body: `<p><b>{{lead.fullName}}</b> has been assigned to <b>{{lead.assignedTo.name}}</b>.</p>`,
  },
  admin_followup: {
    subject: "Follow-up due: {{lead.fullName}}",
    body: `<p>A follow-up is due for <b>{{lead.fullName}}</b>.</p>`,
  },

  counsellor_created: {
    subject: "New lead in your queue: {{lead.fullName}}",
    body: `<p>You've been assigned a new lead.</p>
<ul>
  <li><b>Name:</b> {{lead.fullName}}</li>
  <li><b>Phone:</b> {{lead.phone}} · <b>Email:</b> {{lead.email}}</li>
  <li><b>Source:</b> {{lead.source}} · <b>Country:</b> {{lead.countryCode}}</li>
  <li><b>Score:</b> {{lead.score}} ({{lead.temperature}})</li>
</ul>
<p><a href="{{siteUrl}}/admin/leads/{{lead.id}}">Open lead →</a></p>`,
  },
  counsellor_assigned: {
    subject: "Lead reassigned to you: {{lead.fullName}}",
    body: `<p>You've been assigned <b>{{lead.fullName}}</b>. <a href="{{siteUrl}}/admin/leads/{{lead.id}}">Open →</a></p>`,
  },
  counsellor_status: {
    subject: "Status update on {{lead.fullName}}",
    body: `<p>Stage: <b>{{lead.stage}}</b> · Status: <b>{{lead.status}}</b></p>`,
  },
  counsellor_followup: {
    subject: "Reminder: follow up with {{lead.fullName}}",
    body: `<p>Follow-up with {{lead.fullName}} is due.</p>`,
  },

  lead_created: {
    subject: "Thanks {{lead.firstName}} — we've received your inquiry",
    body: `<p>Hi {{lead.firstName}},</p>
<p>Thanks for reaching out. We've received your details and one of our counsellors will get back to you within one business day.</p>
<p>If you'd like to add anything else, just reply to this email.</p>
<p>— The team</p>`,
  },
  lead_created_whatsapp: {
    body: `Hi {{lead.firstName}}, thanks for reaching out! We've got your inquiry and a counsellor will message you here within one business day.`,
  },
};

export function renderTemplate(
  key: LeadTemplateKey,
  ctx: Record<string, unknown>,
): Template | null {
  const tpl = TEMPLATES[key];
  if (!tpl) return null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const merged = { ...ctx, siteUrl };
  return {
    subject: tpl.subject ? interpolate(tpl.subject, merged) : undefined,
    body: interpolate(tpl.body, merged),
  };
}

/** Minimal `{{a.b.c}}` interpolation — no expressions, no escapes. */
function interpolate(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const value = resolve(ctx, path.split("."));
    return value === undefined || value === null ? "" : String(value);
  });
}

function resolve(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}
