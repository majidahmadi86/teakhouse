/**
 * Confirmation email stub.
 *
 * TODO: Wire a real provider when EMAIL_PROVIDER is set
 * (e.g. "resend" | "sendgrid" | "postmark"). Keep secrets in
 * EMAIL_API_KEY / provider-specific env vars · do not send from the client.
 */

export type ConfirmationEmailPayload = {
  to: string;
  subject: string;
  body: string;
  bookingCode?: string;
};

export type SendEmailResult = {
  ok: boolean;
  stub: boolean;
  provider?: string;
  message?: string;
};

export async function sendConfirmationEmail(
  payload: ConfirmationEmailPayload
): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER?.trim();

  if (!payload.to) {
    return { ok: false, stub: true, message: "Missing recipient" };
  }

  // No provider configured · log and return without sending.
  if (!provider) {
    console.info("[email] stub sendConfirmationEmail · EMAIL_PROVIDER unset", {
      to: payload.to,
      subject: payload.subject,
      bookingCode: payload.bookingCode,
      bodyPreview: payload.body.slice(0, 120),
    });
    return {
      ok: true,
      stub: true,
      message: "Stub only · set EMAIL_PROVIDER to enable delivery",
    };
  }

  // TODO: Dispatch via EMAIL_PROVIDER once credentials are available.
  console.info("[email] TODO send via", provider, {
    to: payload.to,
    subject: payload.subject,
    bookingCode: payload.bookingCode,
  });
  return {
    ok: true,
    stub: true,
    provider,
    message: `Provider "${provider}" not implemented yet · message not sent`,
  };
}

export function applyEmailPlaceholders(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}
