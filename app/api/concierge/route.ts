import { NextResponse } from "next/server";
import { hotelConfig } from "@/config/hotel.config";
import { completeChat, isAiConfigured, type ChatMessage, type ToolCall } from "@/lib/ai";
import { GUEST } from "@/lib/audit";
import { checkAvailability, type AvailabilityResult } from "@/lib/availability";
import {
  availabilityFacts,
  availabilityUnknownReply,
  composeAvailabilityReply,
  handoffHref,
} from "@/lib/conciergeAvailability";
import {
  CONCIERGE_TOOLS,
  detectRequestIntent,
  loadStay,
  requestFiledReply,
  runTool,
  stayFacts,
  type StayContext,
} from "@/lib/conciergeTools";
import { parseDateIntent } from "@/lib/dateIntent";
import { prisma } from "@/lib/db";
import { limitOrReject } from "@/lib/rateLimit";
import { createServiceRequest, type ServiceRequestDto } from "@/lib/serviceRequests";
import { translate } from "@/lib/translate";
import { isLang, langMeta, type Lang } from "@/lib/locales";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 9000;

type ConciergeBody = {
  message?: string;
  lang?: string;
  /** Verified stay · unlocks service requests */
  bookingCode?: string;
  /** Last few turns, plain text, so the model keeps the thread */
  history?: { role: "user" | "assistant"; content: string }[];
  stream?: boolean;
};

function resolveLang(raw: string | undefined): Lang {
  return isLang(raw) ? raw : "en";
}

/** Live room rates from Prisma · never invent prices in the prompt. */
async function liveRoomFacts(): Promise<string> {
  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: { rate: "asc" },
    select: { nameEn: true, nameTh: true, rate: true, ota: true, capacity: true, units: true },
  });
  if (rooms.length === 0) return "No active rooms in the database right now.";
  return rooms
    .map(
      (r) =>
        `${r.nameEn} / ${r.nameTh}: from ฿${r.rate.toLocaleString("en-US")} direct (base rate · specific dates can cost more), OTA ฿${r.ota.toLocaleString("en-US")}, sleeps ${r.capacity}${r.units > 1 ? `, ${r.units} units` : ""}`
    )
    .join(". ");
}

/** Dining, events, packages · the same tables the owner edits. */
async function houseFactsBlock(): Promise<string> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [cats, events, hotel, addons] = await Promise.all([
    prisma.diningCategory.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: { items: { where: { published: true }, orderBy: { order: "asc" }, take: 5 } },
    }),
    prisma.hotelEvent.findMany({ where: { published: true, date: { gte: todayIso } }, orderBy: { date: "asc" }, take: 4 }),
    prisma.hotel.findUnique({
      where: { id: "default" },
      select: { reservationsEnabled: true, serviceStart: true, serviceEnd: true, maxPartySize: true },
    }),
    prisma.addon.findMany({ where: { published: true }, orderBy: { order: "asc" } }),
  ]);

  const menu = cats
    .filter((c) => c.items.length > 0)
    .map((c) => `${c.nameEn}: ${c.items.map((i) => `${i.nameEn} ฿${i.price.toLocaleString("en-US")}`).join(", ")}`)
    .join(". ");
  const upcoming = events.map((e) => `${e.titleEn} (${e.date}): ${e.descriptionEn}`).join(" ");
  const tables = hotel?.reservationsEnabled
    ? `Table reservations: open, service ${hotel.serviceStart} to ${hotel.serviceEnd}, up to ${hotel.maxPartySize} guests per table, no deposit and no card details. Send guests to /dining/reserve. Larger parties should call the house.`
    : "Table reservations: not being taken online right now · send guests to /contact for a table.";
  const packages = addons
    .map((a) => `${a.nameEn} ฿${a.price.toLocaleString("en-US")} per ${a.unit}`)
    .join(", ");

  return [
    "Dining: breakfast on the pier 07:00 to 11:00, kitchen until 22:00, full menu at /dining.",
    menu ? `Menu highlights (live prices): ${menu}.` : "",
    tables,
    "Events & spaces: the riverside pavilion hosts weddings, private dinners and parties · 60 seated, 90 standing · details at /events.",
    upcoming ? `Coming up: ${upcoming}` : "",
    packages ? `Stay packages (bookable on /book, live prices): ${packages}.` : "",
    "Payment: PromptPay, cards, Apple Pay and Google Pay, bank transfer, or crypto · all on the booking page. Prices can be shown in 11 currencies.",
  ]
    .filter(Boolean)
    .join(" ");
}

function configFacts(lang: Lang): string {
  const facts = hotelConfig.concierge.facts.map((f) => f[lang === "th" ? "th" : "en"]).join(" ");
  const contact = hotelConfig.contact;
  return [
    `Hotel: ${hotelConfig.name}.`,
    `Tagline: ${hotelConfig.tagline[lang === "th" ? "th" : "en"]}.`,
    facts,
    `Address: ${contact.address[lang === "th" ? "th" : "en"]}.`,
    `Phone: ${contact.phone}. Email: ${contact.email}. LINE: ${contact.line}.`,
    `Check-in ${hotelConfig.policies.checkIn}, check-out ${hotelConfig.policies.checkOut}.`,
    `Deposit: ${hotelConfig.policies.depositPct}% to confirm.`,
    `Cancel: ${hotelConfig.policies.cancel[lang === "th" ? "th" : "en"]}`,
    `Pets: ${hotelConfig.policies.pets[lang === "th" ? "th" : "en"]}`,
  ].join(" ");
}

function buildSystemPrompt(
  lang: Lang,
  roomFacts: string,
  availability: AvailabilityResult | null,
  availabilityFailed: boolean,
  houseFacts: string,
  stay: StayContext | null
): string {
  const replyLang = langMeta(lang).english;
  const name = hotelConfig.concierge.name[lang === "th" ? "th" : "en"];
  const linkHref = handoffHref(availability);

  const availabilityRules = availability
    ? [
        "The AVAILABILITY block below was computed from the live booking database for the dates this guest asked about.",
        "State availability and stay prices ONLY from that block. Never add a room, a date, or a price that is not in it.",
        "If the block says nothing is available, say so plainly and offer the nearest alternative it lists.",
      ]
    : availabilityFailed
      ? [
          "The availability lookup FAILED for this request. You do not know what is free.",
          "Never guess. Say you will check with the house, and hand off to the booking page.",
        ]
      : [
          "No dates were named, so you do not know what is free tonight or on any date.",
          "Never state that a room is available or unavailable. If the guest wants dates checked, hand off to the booking page.",
          "Room prices in FACTS are base rates · specific dates can be priced higher, so quote them as 'from'.",
        ];

  const stayRules = stay
    ? [
        "This guest has a VERIFIED STAY (see GUEST STAY). When they ask for something concrete during their stay · breakfast to the room, housekeeping, a spa slot, a car, a table, an itinerary · call create_service_request immediately with clear details, then confirm what you filed and when they can expect it. Do not ask for a booking code again.",
      ]
    : [
        "No verified stay. If the guest asks for in-stay service (room service, housekeeping, spa, transfers), ask for their booking code (format TKH-1234) so you can file it with the desk. Never claim to have arranged anything.",
      ];

  return [
    `You are ${name}, the in-house concierge for ${hotelConfig.name}, an ultra-luxury riverside house.`,
    `Reply only in ${replyLang}.`,
    "Use ONLY the FACTS block below. Never invent prices, fees, room names, or amenities.",
    ...availabilityRules,
    ...stayRules,
    `When the guest wants to book, hand off with this exact HTML: <a href="${linkHref}" class="font-extrabold text-blue">Book direct here</a>`,
    "Guardrails: no em-dash characters (use · or commas); no emojis; at most 120 words; warm, precise, unhurried; HTML links only in the form shown above.",
    "",
    "FACTS:",
    configFacts(lang),
    `Rooms (source of truth): ${roomFacts}`,
    houseFacts,
    stay ? stayFacts(stay, lang) : "",
    availability ? `\nAVAILABILITY:\n${availabilityFacts(availability)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

type Frame =
  | { type: "delta"; text: string }
  | { type: "action"; kind: "service_request"; request: ServiceRequestDto }
  | { type: "done"; source: string; reply: string };

/** Stay lookup for the panel · code only, dates and room, no personal data. */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const stay = await loadStay(code);
  if (!stay) return NextResponse.json({ valid: false }, { status: 404 });
  return NextResponse.json({
    valid: true,
    code: stay.code,
    roomEn: stay.roomEn,
    roomTh: stay.roomTh,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    status: stay.status,
  });
}

export async function POST(req: Request) {
  const limited = limitOrReject(req, "concierge");
  if (limited) return limited;

  let body: ConciergeBody;
  try {
    body = (await req.json()) as ConciergeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim().slice(0, 2000) ?? "";
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const lang = resolveLang(body.lang);
  const fallback = hotelConfig.concierge.fallback[lang === "th" ? "th" : "en"];
  const history: ChatMessage[] = (body.history ?? [])
    .filter((h) => (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
    .slice(-6)
    .map((h) => ({ role: h.role, content: h.content.slice(0, 1500) }));

  const stay = await loadStay(body.bookingCode).catch(() => null);

  // ── Live calendar read · runs before the model, for every dated question ──
  const intent = parseDateIntent(message, new Date(), lang === "th" ? "th" : "en");
  let availability: AvailabilityResult | null = null;
  let availabilityFailed = false;
  if (intent) {
    try {
      availability = await checkAvailability(intent.checkIn, intent.checkOut);
    } catch (e) {
      console.error("[api/concierge] availability", e);
      availabilityFailed = true;
    }
  }

  const deterministic = availability
    ? composeAvailabilityReply(availability, lang)
    : availabilityFailed
      ? availabilityUnknownReply(lang)
      : null;

  // ── No model · the deterministic concierge still files requests ──────────
  if (!isAiConfigured()) {
    const kind = stay ? detectRequestIntent(message) : null;
    if (stay && kind) {
      const filed = await createServiceRequest(
        { bookingId: stay.bookingId, kind, title: message.slice(0, 100), details: message, source: "concierge_ai" },
        GUEST
      );
      if (!("error" in filed)) {
        return NextResponse.json({
          reply: requestFiledReply(lang, filed),
          source: "request",
          actions: [{ kind: "service_request", request: filed }],
        });
      }
    }
    if (deterministic) {
      return NextResponse.json({
        reply: deterministic,
        source: availability ? "availability" : "availability-unknown",
      });
    }
    if (stay && !kind) {
      return NextResponse.json({ reply: translate(lang, "cg.req.askWhat"), source: "stay" });
    }
    return NextResponse.json({ error: "AI not configured", fallback: true }, { status: 503 });
  }

  let roomFacts: string;
  try {
    roomFacts = await liveRoomFacts();
  } catch (e) {
    console.error("[api/concierge] room facts", e);
    return NextResponse.json({ reply: deterministic ?? fallback, source: deterministic ? "availability" : "fallback" });
  }
  const houseFacts = await houseFactsBlock().catch((e) => {
    console.error("[api/concierge] house facts", e);
    return "";
  });
  const system = buildSystemPrompt(lang, roomFacts, availability, availabilityFailed, houseFacts, stay);
  const messages: ChatMessage[] = [...history, { role: "user", content: message }];
  const tools = stay ? CONCIERGE_TOOLS : undefined;

  /**
   * One conversation, two transports. `run` drives the model (with an optional
   * tool round) and reports frames; the JSON path collects them, the stream
   * path forwards them as they happen.
   */
  async function run(emit: (f: Frame) => void): Promise<void> {
    const first = await completeChat({
      system,
      messages,
      tools,
      timeoutMs: TIMEOUT_MS,
      maxTokens: 400,
      onDelta: (text) => emit({ type: "delta", text }),
    });

    if (!first.ok) {
      if (first.timedOut) console.warn("[api/concierge] timed out after", TIMEOUT_MS, "ms");
      else console.error("[api/concierge]", first.error);
      const reply = deterministic ?? fallback;
      emit({ type: "delta", text: reply });
      emit({ type: "done", source: deterministic ? "availability" : first.timedOut ? "timeout" : "fallback", reply });
      return;
    }

    if (first.toolCalls.length === 0) {
      emit({ type: "done", source: "ai", reply: first.text });
      return;
    }

    const results = [];
    for (const call of first.toolCalls as ToolCall[]) {
      const outcome = await runTool(call, stay);
      if (outcome.request) emit({ type: "action", kind: "service_request", request: outcome.request });
      results.push({ id: outcome.id, content: outcome.content });
    }

    let text = "";
    const second = await completeChat({
      system,
      messages,
      tools,
      toolRound: { assistantText: first.text, calls: first.toolCalls, results },
      timeoutMs: TIMEOUT_MS,
      maxTokens: 300,
      onDelta: (t) => {
        text += t;
        emit({ type: "delta", text: t });
      },
    });
    if (!second.ok) {
      const filed = results.find((r) => r.content.startsWith("FILED"));
      const reply = filed ? translate(lang, "cg.req.filedShort") : fallback;
      emit({ type: "delta", text: reply });
      emit({ type: "done", source: "ai-tool-fallback", reply });
      return;
    }
    emit({ type: "done", source: "ai", reply: second.text || text });
  }

  if (body.stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (f: Frame) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(f)}\n\n`));
        try {
          await run(emit);
        } catch (e) {
          console.error("[api/concierge] stream", e);
          emit({ type: "delta", text: fallback });
          emit({ type: "done", source: "error", reply: fallback });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        "x-accel-buffering": "no",
      },
    });
  }

  let reply = "";
  let source = "ai";
  const actions: { kind: string; request: ServiceRequestDto }[] = [];
  let streamed = "";
  await run((f) => {
    if (f.type === "delta") streamed += f.text;
    if (f.type === "action") actions.push({ kind: f.kind, request: f.request });
    if (f.type === "done") {
      reply = f.reply || streamed;
      source = f.source;
    }
  });
  return NextResponse.json({
    reply: reply || streamed || fallback,
    source,
    actions,
    availability: availability ? { checkIn: availability.checkIn, checkOut: availability.checkOut } : null,
  });
}
