/**
 * v15 · PromptPay · EMVCo merchant-presented QR payload (Thai QR standard).
 *
 * Pure. Given the house's PromptPay ID (a phone number, a 13-digit tax/citizen
 * id, or a 15-digit e-wallet id) and an amount, this returns the string a
 * banking app scans. The QR image is rendered client-side from this payload.
 *
 * Tag layout: 00 version · 01 point of initiation (12 = one-time with amount)
 * · 29 merchant account (AID + id) · 53 currency 764 (THB) · 54 amount ·
 * 58 country · 63 CRC-16/CCITT-FALSE over everything including "6304".
 */

const AID_PROMPTPAY = "A000000677010111";

function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, "0")}${value}`;
}

export function crc16ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** "081-234-5678" → "0066812345678" · a tax id or e-wallet id passes through. */
export function normalisePromptPayId(raw: string): { kind: "phone" | "taxid" | "ewallet"; value: string } | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 15) return { kind: "ewallet", value: digits };
  if (digits.length === 13) return { kind: "taxid", value: digits };
  if (digits.length === 10 && digits.startsWith("0")) return { kind: "phone", value: `0066${digits.slice(1)}` };
  if (digits.length === 11 && digits.startsWith("66")) return { kind: "phone", value: `00${digits}` };
  if (digits.length === 13 && digits.startsWith("0066")) return { kind: "phone", value: digits };
  return null;
}

export function promptPayPayload(promptPayId: string, amountThb: number): string | null {
  const id = normalisePromptPayId(promptPayId);
  if (!id) return null;
  const subTag = id.kind === "phone" ? "01" : id.kind === "taxid" ? "02" : "03";
  const merchant = tlv("00", AID_PROMPTPAY) + tlv(subTag, id.value);
  const amount = Math.max(0, amountThb).toFixed(2);
  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("29", merchant) +
    tlv("53", "764") +
    tlv("54", amount) +
    tlv("58", "TH") +
    "6304";
  return body + crc16ccitt(body);
}
