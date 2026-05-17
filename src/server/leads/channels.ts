/**
 * Notification channel adapters.
 *
 * Each adapter implements a tiny interface. The default exports are picked
 * from env at import time:
 *
 *   EMAIL_PROVIDER     = "resend" | "smtp" | "console" (default: console in dev, fails in prod)
 *   WHATSAPP_PROVIDER  = "meta_cloud" | "console"
 *
 * Real provider implementations are intentionally thin wrappers. The point of
 * the adapter is to keep `notifications.ts` ignorant of which SDK is wired —
 * swapping Resend for SendGrid is one file's worth of work, not a refactor.
 *
 * Required env vars per provider:
 *   resend       → RESEND_API_KEY
 *   smtp         → SMTP_URL  (e.g. smtps://user:pass@host:465)
 *   meta_cloud   → WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 */
import "server-only";

// ── Email ──────────────────────────────────────────────────────────────────

export interface EmailSendArgs {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export interface EmailSendResult {
  providerMessageId?: string;
}

export interface EmailAdapter {
  send(args: EmailSendArgs): Promise<EmailSendResult>;
}

const consoleEmailAdapter: EmailAdapter = {
  async send(args) {
    console.log(
      `[email:console] → ${args.to} | ${args.subject}\n${args.html.slice(0, 280)}${
        args.html.length > 280 ? "…" : ""
      }`,
    );
    return { providerMessageId: `console_${Date.now()}` };
  },
};

const resendEmailAdapter: EmailAdapter = {
  async send(args) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not set");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: args.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as { id?: string };
    return { providerMessageId: json.id };
  },
};

const smtpEmailAdapter: EmailAdapter = {
  async send(args) {
    // nodemailer is not in the bootstrap deps yet. Add it (`npm i nodemailer
    // @types/nodemailer`) before flipping EMAIL_PROVIDER=smtp.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodemailer = await import("nodemailer" as never).catch(() => null as any);
    if (!nodemailer) throw new Error("nodemailer not installed");
    const url = process.env.SMTP_URL;
    if (!url) throw new Error("SMTP_URL not set");
    const transport = nodemailer.createTransport(url);
    const info = await transport.sendMail({
      to: args.to,
      from: args.from,
      subject: args.subject,
      html: args.html,
    });
    return { providerMessageId: info.messageId };
  },
};

export const emailAdapter: EmailAdapter = (() => {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  switch (provider) {
    case "resend":
      return resendEmailAdapter;
    case "smtp":
      return smtpEmailAdapter;
    case "console":
    default:
      return consoleEmailAdapter;
  }
})();

// ── WhatsApp (Meta Cloud API) ──────────────────────────────────────────────

export interface WhatsAppSendArgs {
  to: string; // E.164, no leading +; the adapter normalises
  templateName: string;
  languageCode: string;
  bodyText: string;
  params: Record<string, unknown>;
}

export interface WhatsAppSendResult {
  providerMessageId?: string;
}

export interface WhatsAppAdapter {
  send(args: WhatsAppSendArgs): Promise<WhatsAppSendResult>;
}

const consoleWhatsAppAdapter: WhatsAppAdapter = {
  async send(args) {
    console.log(
      `[whatsapp:console] → ${args.to} | template=${args.templateName}\n${args.bodyText.slice(0, 280)}`,
    );
    return { providerMessageId: `console_${Date.now()}` };
  },
};

const metaCloudWhatsAppAdapter: WhatsAppAdapter = {
  async send(args) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) throw new Error("WhatsApp credentials missing");

    const to = args.to.replace(/[^\d]/g, "");
    // Default to a freeform text message; switch to template when we have a
    // matching approved template registered in Meta Business Manager.
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: args.bodyText },
    } as const;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { messages?: { id: string }[] };
    return { providerMessageId: json.messages?.[0]?.id };
  },
};

export const whatsappAdapter: WhatsAppAdapter = (() => {
  const provider = process.env.WHATSAPP_PROVIDER ?? "console";
  return provider === "meta_cloud" ? metaCloudWhatsAppAdapter : consoleWhatsAppAdapter;
})();
