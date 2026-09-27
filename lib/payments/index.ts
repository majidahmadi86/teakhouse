import { prisma } from "@/lib/db";
import { audit, GUEST, SYSTEM, type AuditActor } from "@/lib/audit";
import { isCurrencyCode, type CurrencyCode } from "@/lib/currencies";
import { getRates, rateFor } from "@/lib/fx";
import { createCryptoCharge, isCryptoConfigured } from "@/lib/payments/crypto";
import { promptPayPayload } from "@/lib/payments/promptpay";
import { createCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe";

/**
 * v15 · Payment rails · one entry point, four ways to pay, no card data here.
 *
 *   promptpay · a real EMVCo QR for the house's PromptPay ID (bank app scans it)
 *   card      · Stripe hosted Checkout (cards, Apple Pay, Google Pay) · PCI SAQ-A
 *   wire      · bank transfer instructions, booking held as pending_wire
 *   crypto    · Coinbase Commerce hosted charge
 *
 * A rail whose provider is not configured runs in DEMO mode: the payment is
 * recorded as a demo row and the booking is marked paid so the flow completes.
 * The response says so, and the UI says so to the guest.
 */

export type Rail = "promptpay" | "card" | "wire" | "crypto";

export function isRail(v: unknown): v is Rail {
  return v === "promptpay" || v === "card" || v === "wire" || v === "crypto";
}

export type RailAvailability = Record<Rail, { enabled: boolean; live: boolean }>;

export async function railAvailability(): Promise<RailAvailability> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: "default" },
    select: { promptPayId: true, bankAccountNo: true },
  });
  return {
    promptpay: { enabled: true, live: Boolean(hotel?.promptPayId) },
    card: { enabled: true, live: isStripeConfigured() },
    wire: { enabled: true, live: Boolean(hotel?.bankAccountNo) },
    crypto: { enabled: true, live: isCryptoConfigured() },
  };
}

export type StartPaymentInput = {
  bookingId: string;
  rail: Rail;
  /** deposit or full · amounts are in THB */
  amountThb: number;
  currency?: string;
  returnUrl: string;
  cancelUrl: string;
};

export type StartPaymentResult =
  | { kind: "redirect"; url: string; paymentId: string; live: true }
  | { kind: "promptpay"; payload: string | null; amountThb: number; paymentId: string; live: boolean }
  | {
      kind: "wire";
      paymentId: string;
      instructions: { bankName: string; accountName: string; accountNo: string; swift: string; reference: string };
      live: boolean;
    }
  | { kind: "demo"; paymentId: string; rail: Rail; live: false };

export async function startPayment(input: StartPaymentInput, actor: AuditActor = GUEST): Promise<StartPaymentResult> {
  const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
  if (!booking) throw new Error("booking not found");
  const hotel = await prisma.hotel.findUnique({ where: { id: "default" } });
  const currency: CurrencyCode = isCurrencyCode(input.currency) ? input.currency : "THB";
  const rates = await getRates();
  const fx = rateFor(rates, currency);
  const charged = Math.round(input.amountThb * fx * 100) / 100;
  const description = `${hotel?.name ?? "Stay"} · ${booking.code}`;

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: input.rail === "card" ? "stripe" : input.rail === "crypto" ? "crypto" : input.rail,
      method: input.rail,
      amount: Math.round(input.amountThb),
      currency,
      fxRate: fx,
      chargedAmount: charged,
      status: "pending",
    },
  });

  if (input.rail === "card" && isStripeConfigured()) {
    const session = await createCheckoutSession({
      bookingId: booking.id,
      bookingCode: booking.code,
      amount: charged,
      currency,
      description,
      email: booking.email || undefined,
      successUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: session.id, payload: JSON.stringify({ url: session.url }) },
    });
    await audit(actor, "payment.started", "payment", payment.id, { rail: "card", provider: "stripe" });
    return { kind: "redirect", url: session.url, paymentId: payment.id, live: true };
  }

  if (input.rail === "crypto" && isCryptoConfigured()) {
    const charge = await createCryptoCharge({
      bookingId: booking.id,
      bookingCode: booking.code,
      amount: charged,
      currency,
      description,
      redirectUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: charge.id } });
    await audit(actor, "payment.started", "payment", payment.id, { rail: "crypto" });
    return { kind: "redirect", url: charge.url, paymentId: payment.id, live: true };
  }

  if (input.rail === "promptpay") {
    const payload = hotel?.promptPayId ? promptPayPayload(hotel.promptPayId, input.amountThb) : null;
    await audit(actor, "payment.started", "payment", payment.id, { rail: "promptpay", live: Boolean(payload) });
    if (!payload) {
      // No PromptPay ID on file · complete as a demo payment so the flow ends.
      await settlePayment(payment.id, "demo", SYSTEM);
    }
    return { kind: "promptpay", payload, amountThb: input.amountThb, paymentId: payment.id, live: Boolean(payload) };
  }

  if (input.rail === "wire") {
    const live = Boolean(hotel?.bankAccountNo);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: live ? "pending_wire" : booking.paymentStatus },
    });
    await audit(actor, "payment.started", "payment", payment.id, { rail: "wire", live });
    if (!live) await settlePayment(payment.id, "demo", SYSTEM);
    return {
      kind: "wire",
      paymentId: payment.id,
      live,
      instructions: {
        bankName: hotel?.bankName ?? "",
        accountName: hotel?.bankAccountName ?? "",
        accountNo: hotel?.bankAccountNo ?? "",
        swift: hotel?.bankSwift ?? "",
        reference: booking.code,
      },
    };
  }

  // Card or crypto without a provider · demo settle.
  await settlePayment(payment.id, "demo", SYSTEM);
  return { kind: "demo", paymentId: payment.id, rail: input.rail, live: false };
}

/** Mark a payment succeeded and roll the booking's paid amount + status forward. */
export async function settlePayment(
  paymentId: string,
  providerRefOrMode: string,
  actor: AuditActor,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
  if (!payment || payment.status === "succeeded") return;
  const paid = payment.booking.paidAmount + payment.amount;
  const status = paid >= payment.booking.amount + payment.booking.packagesAmount ? "paid" : "deposit";
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "succeeded",
        paidAt: new Date(),
        providerRef: providerRefOrMode === "demo" ? "demo" : providerRefOrMode,
        provider: providerRefOrMode === "demo" ? "demo" : payment.provider,
        payload: JSON.stringify(extra),
      },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { paidAmount: paid, paymentStatus: status },
    }),
  ]);
  await audit(actor, "payment.settled", "payment", paymentId, {
    bookingId: payment.bookingId,
    amount: payment.amount,
    mode: providerRefOrMode === "demo" ? "demo" : "live",
  });
}

/** Settle by provider reference · what the webhooks call. */
export async function settleByProviderRef(
  provider: string,
  providerRef: string,
  extra: Record<string, unknown> = {}
): Promise<boolean> {
  const payment = await prisma.payment.findFirst({ where: { provider, providerRef } });
  if (!payment) return false;
  await settlePayment(payment.id, providerRef, SYSTEM, extra);
  return true;
}
