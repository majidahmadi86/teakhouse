import { prisma } from "@/lib/db";
import { GUEST } from "@/lib/audit";
import type { ToolCall, ToolDef } from "@/lib/ai";
import { createServiceRequest, isRequestKind, REQUEST_KINDS, type ServiceRequestDto } from "@/lib/serviceRequests";
import { translate, type Lang } from "@/lib/translate";

/**
 * v15 · What the concierge can DO, not just say.
 *
 * With a booking code in hand the concierge knows the stay and may file a
 * service request straight to the desk: breakfast to the balcony, a spa slot,
 * an airport car, an itinerary. Without a code it asks for one · it never files
 * against a guess. The same tool is used by the model (tool use) and by the
 * deterministic path (regex intent), so the desk sees identical rows.
 */

export type StayContext = {
  bookingId: string;
  code: string;
  guestFirstName: string;
  roomEn: string;
  roomTh: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

export async function loadStay(code: string | undefined | null): Promise<StayContext | null> {
  const clean = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}-\d{4}$/.test(clean)) return null;
  const b = await prisma.booking.findUnique({
    where: { code: clean },
    include: { room: { select: { nameEn: true, nameTh: true } } },
  });
  if (!b || b.status === "cancelled") return null;
  return {
    bookingId: b.id,
    code: b.code,
    guestFirstName: b.guest.split(" ")[0] ?? "",
    roomEn: b.room.nameEn,
    roomTh: b.room.nameTh,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    status: b.status,
  };
}

export function stayFacts(stay: StayContext, lang: Lang): string {
  const room = lang === "th" ? stay.roomTh : stay.roomEn;
  const state =
    stay.status === "in" ? "currently in house" : stay.status === "out" ? "checked out" : "arriving";
  return `GUEST STAY (verified by booking code): ${stay.guestFirstName}, ${room}, ${stay.checkIn} to ${stay.checkOut}, ${state}. Booking ${stay.code}.`;
}

export const CONCIERGE_TOOLS: ToolDef[] = [
  {
    name: "create_service_request",
    description:
      "File a request with the front desk for the verified guest stay: room service, housekeeping, spa, transfer, dining, itinerary help, or anything else. Use it as soon as the guest asks for something concrete. Never use it without a verified stay.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: REQUEST_KINDS, description: "Category of the request" },
        title: { type: "string", description: "One line the desk can act on, max 100 characters" },
        details: { type: "string", description: "Everything the desk needs: quantities, preferences, allergies, flight numbers" },
        due: { type: "string", description: "When the guest wants it, e.g. 'tomorrow 07:30' or an ISO date" },
      },
      required: ["kind", "title"],
    },
  },
];

export type ToolOutcome = {
  id: string;
  content: string;
  request?: ServiceRequestDto;
};

export async function runTool(call: ToolCall, stay: StayContext | null): Promise<ToolOutcome> {
  if (call.name !== "create_service_request") {
    return { id: call.id, content: `Unknown tool ${call.name}` };
  }
  if (!stay) {
    return { id: call.id, content: "REFUSED: no verified stay. Ask the guest for their booking code first." };
  }
  const input = call.input as { kind?: unknown; title?: unknown; details?: unknown; due?: unknown };
  const result = await createServiceRequest(
    {
      bookingId: stay.bookingId,
      kind: isRequestKind(input.kind) ? input.kind : "other",
      title: typeof input.title === "string" ? input.title : "Guest request",
      details: typeof input.details === "string" ? input.details : "",
      due: typeof input.due === "string" ? input.due : "",
      source: "concierge_ai",
    },
    GUEST
  );
  if ("error" in result) return { id: call.id, content: `FAILED: ${result.error}` };
  return {
    id: call.id,
    content: `FILED with the desk as request ${result.id.slice(-6).toUpperCase()} (${result.kind}: ${result.title}). Tell the guest it is with the desk now and when to expect it.`,
    request: result,
  };
}

/* ── Deterministic path · when no model is configured ───────────────────── */

const REQUEST_INTENTS: { kind: (typeof REQUEST_KINDS)[number]; k: RegExp }[] = [
  { kind: "room_service", k: /breakfast|room service|coffee|dinner in|to (my|the) room|อาหารเช้า|รูมเซอร์วิส|กาแฟ|ส่งที่ห้อง/i },
  { kind: "housekeeping", k: /towel|clean|housekeeping|pillow|turn ?down|laundry|ผ้าเช็ดตัว|ทำความสะอาด|หมอน|ซักผ้า/i },
  { kind: "spa", k: /spa|massage|treatment|facial|สปา|นวด|ทรีตเมนต์/i },
  { kind: "transfer", k: /airport|car|taxi|transfer|driver|boat|สนามบิน|รถ|แท็กซี่|รับส่ง|เรือ/i },
  { kind: "dining", k: /table|restaurant|reserve|dinner|lunch|โต๊ะ|ร้านอาหาร|มื้อค่ำ|มื้อเที่ยง/i },
  { kind: "itinerary", k: /itinerary|plan|tour|temple|market|recommend|what to do|แผน|เที่ยว|วัด|ตลาด|แนะนำ/i },
];

export function detectRequestIntent(message: string): (typeof REQUEST_KINDS)[number] | null {
  for (const intent of REQUEST_INTENTS) if (intent.k.test(message)) return intent.kind;
  return null;
}

/** The templated confirmation for a deterministically filed request. */
export function requestFiledReply(lang: Lang, request: ServiceRequestDto): string {
  return translate(lang, "cg.req.filed", {
    kind: translate(lang, `cg.req.kind.${request.kind}`),
    ref: request.id.slice(-6).toUpperCase(),
  });
}
