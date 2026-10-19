import "server-only";
import { prisma } from "@/lib/db";
import { applyEmailPlaceholders, escapeHtml, sendEmail, type SendEmailResult } from "@/lib/email";
import { formatDay, formatTime, guestsLabel } from "@/lib/i18n-core";
import { formatBaht } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

/**
 * v18 · The booking confirmation email, in the guest's language.
 *
 * English uses the owner's template from Settings (key booking_confirmation);
 * Thai uses booking_confirmation_th when the owner has saved one, otherwise
 * the house Thai template below. Both carry the room name in that language,
 * the dates written for that language, the deposit and the balance, and the
 * confirmation link.
 */
export type EmailLang = "en" | "th";

export const EN_SUBJECT = "Your stay at {{hotelName}} · {{code}}";
export const EN_BODY = [
  "Dear {{guestName}},",
  "",
  "Thank you for choosing {{hotelName}}. Your stay is confirmed.",
  "",
  "Confirmation: {{code}}",
  "Room: {{roomName}}",
  "Check-in: {{checkIn}}, from {{checkInTime}}",
  "Check-out: {{checkOut}}, until {{checkOutTime}}",
  "Guests: {{guests}}",
  "",
  "Stay total: {{amount}}",
  "Deposit ({{depositPct}}%): {{deposit}}",
  "Balance, settled at the hotel: {{balance}}",
  "",
  "Your confirmation, any time: {{link}}",
  "",
  "We look forward to welcoming you by the river.",
  "{{hotelName}}",
].join("\n");

export const TH_SUBJECT = "ยืนยันการเข้าพักที่ {{hotelName}} · {{code}}";
export const TH_BODY = [
  "เรียน คุณ{{guestName}}",
  "",
  "ขอบคุณที่เลือก {{hotelName}} การเข้าพักของท่านได้รับการยืนยันเรียบร้อยแล้ว",
  "",
  "หมายเลขยืนยัน: {{code}}",
  "ห้องพัก: {{roomName}}",
  "เช็คอิน: {{checkIn}} ตั้งแต่ {{checkInTime}}",
  "เช็คเอาท์: {{checkOut}} ภายใน {{checkOutTime}}",
  "จำนวนผู้เข้าพัก: {{guests}}",
  "",
  "ยอดรวมการเข้าพัก: {{amount}}",
  "มัดจำ ({{depositPct}}%): {{deposit}}",
  "ยอดคงเหลือ ชำระที่โรงแรม: {{balance}}",
  "",
  "ดูใบยืนยันการจองได้ทุกเมื่อที่: {{link}}",
  "",
  "เรายินดีเป็นอย่างยิ่งที่จะได้ต้อนรับท่านริมแม่น้ำเจ้าพระยา",
  "{{hotelName}}",
].join("\n");

export type BookingEmailInput = {
  bookingId: string;
  code: string;
  guest: string;
  email: string;
  roomSlug: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  adults?: number | null;
  children?: number | null;
  lang: EmailLang;
  /** Absolute or site-relative confirmation path. */
  link: string;
};

export async function sendBookingConfirmation(input: BookingEmailInput): Promise<SendEmailResult> {
  const [hotel, room, enTemplate, thTemplate] = await Promise.all([
    prisma.hotel.findUnique({ where: { id: "default" } }),
    prisma.room.findUnique({ where: { slug: input.roomSlug }, select: { nameEn: true, nameTh: true } }),
    prisma.emailTemplate.findUnique({
      where: { hotelId_key: { hotelId: "default", key: "booking_confirmation" } },
    }),
    prisma.emailTemplate.findUnique({
      where: { hotelId_key: { hotelId: "default", key: "booking_confirmation_th" } },
    }),
  ]);

  const lang = input.lang;
  const depositPct = clampPct(hotel?.depositPct ?? 30);
  const deposit = Math.round((input.amount * depositPct) / 100);
  const balance = input.amount - deposit;
  const guests = (input.adults ?? 0) + (input.children ?? 0);
  const link = input.link.startsWith("http") ? input.link : `${SITE_URL.replace(/\/$/, "")}${input.link}`;

  const vars: Record<string, string> = {
    hotelName: hotel?.name ?? "The Teak House",
    guestName: input.guest,
    code: input.code,
    roomName: (lang === "th" ? room?.nameTh : room?.nameEn) || room?.nameEn || input.roomSlug,
    checkIn: formatDay(lang, input.checkIn, { year: true }),
    checkOut: formatDay(lang, input.checkOut, { year: true }),
    checkInTime: formatTime(lang, hotel?.checkInTime ?? "14:00"),
    checkOutTime: formatTime(lang, hotel?.checkOutTime ?? "12:00"),
    guests: guests > 0 ? guestsLabel(lang, guests) : "",
    amount: formatBaht(input.amount),
    deposit: formatBaht(deposit),
    depositPct: String(depositPct),
    balance: formatBaht(balance),
    link,
  };

  const template =
    lang === "th"
      ? { subject: thTemplate?.subject || TH_SUBJECT, body: thTemplate?.body || TH_BODY }
      : { subject: enTemplate?.subject || EN_SUBJECT, body: enTemplate?.body || EN_BODY };

  let body = applyEmailPlaceholders(template.body, vars);
  // An owner template written before v18 may not mention the balance or the
  // link · the guest still gets both.
  if (!template.body.includes("{{balance}}")) {
    body +=
      lang === "th"
        ? `\n\nมัดจำ (${vars.depositPct}%): ${vars.deposit} · ยอดคงเหลือ ชำระที่โรงแรม: ${vars.balance}`
        : `\n\nDeposit (${vars.depositPct}%): ${vars.deposit} · Balance, settled at the hotel: ${vars.balance}`;
  }
  if (!template.body.includes("{{link}}")) {
    body += lang === "th" ? `\nใบยืนยันการจอง: ${link}` : `\nYour confirmation: ${link}`;
  }

  const subject = applyEmailPlaceholders(template.subject, vars);
  const html = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1f1b16">${escapeHtml(body)
    .split("\n")
    .join("<br>")}</div>`;

  return sendEmail({
    to: input.email,
    subject,
    body,
    html,
    bookingCode: input.code,
    replyTo: hotel?.email || undefined,
  });
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 30;
  return Math.min(100, Math.max(0, Math.round(n)));
}
