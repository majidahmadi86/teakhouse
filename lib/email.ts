/**
 * Transactional email · server only.
 *
 * v18 · Delivery goes through Resend when RESEND_API_KEY is set (a plain
 * fetch to its REST API, no SDK). Without a key the message is logged and
 * not sent, so a local or preview server never mails a guest by accident.
 *
 *   RESEND_API_KEY   enables delivery
 *   EMAIL_FROM       the sender, e.g. "The Teak House <stay@teakhouse.example>"
 *                    (defaults to Resend's shared test sender)
 *   EMAIL_REPLY_TO   optional reply-to address
 */
import { isReadOnlyDeployment } from "@/lib/readOnly";

export type EmailPayload = {
  to: string;
  subject: string;
  /** Plain-text body · always sent, the fallback for every client. */
  body: string;
  /** Optional HTML body. */
  html?: string;
  bookingCode?: string;
  replyTo?: string;
};

/** Kept for callers written against the v8 stub. */
export type ConfirmationEmailPayload = EmailPayload;

export type SendEmailResult = {
  ok: boolean;
  /** True when nothing was handed to a provider (no key, read-only server). */
  stub: boolean;
  provider?: string;
  id?: string;
  message?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "The Teak House <onboarding@resend.dev>";

export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  if (!payload.to) {
    return { ok: false, stub: true, message: "Missing recipient" };
  }

  // v17 · A read-only deployment (a preview) never sends mail to a guest.
  if (isReadOnlyDeployment()) {
    return { ok: false, stub: true, message: "Read-only deployment · not sent" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[email] RESEND_API_KEY unset · logged, not sent", {
      to: payload.to,
      subject: payload.subject,
      bookingCode: payload.bookingCode,
      bodyPreview: payload.body.slice(0, 160),
    });
    return { ok: true, stub: true, message: "Logged only · set RESEND_API_KEY to send" };
  }

  const replyTo = payload.replyTo || process.env.EMAIL_REPLY_TO?.trim() || undefined;
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [payload.to],
        subject: payload.subject,
        text: payload.body,
        ...(payload.html ? { html: payload.html } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      console.error("[email] Resend refused the message", res.status, data.message);
      return { ok: false, stub: false, provider: "resend", message: data.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, stub: false, provider: "resend", id: data.id };
  } catch (e) {
    console.error("[email] Resend request failed", e);
    return { ok: false, stub: false, provider: "resend", message: "Request failed" };
  }
}

/** The v8 name, kept so existing callers keep compiling. */
export function sendConfirmationEmail(payload: EmailPayload): Promise<SendEmailResult> {
  return sendEmail(payload);
}

export function applyEmailPlaceholders(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

/** Escape text for the HTML body. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
