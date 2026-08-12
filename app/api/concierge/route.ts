import { NextResponse } from "next/server";
import { hotelConfig } from "@/config/hotel.config";
import { completeChat, isAiConfigured } from "@/lib/ai";
import { checkAvailability, type AvailabilityResult } from "@/lib/availability";
import {
  availabilityFacts,
  availabilityUnknownReply,
  composeAvailabilityReply,
  handoffHref,
} from "@/lib/conciergeAvailability";
import { parseDateIntent } from "@/lib/dateIntent";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 6000;

type ConciergeBody = {
  message?: string;
  lang?: string;
};

function resolveLang(raw: string | undefined): "en" | "th" {
  return raw === "th" ? "th" : "en";
}

/** Live room rates from Prisma · never invent prices in the prompt. */
async function liveRoomFacts(): Promise<string> {
  const rooms = await prisma.room.findMany({
    where: { active: true },
    orderBy: { rate: "asc" },
    select: { nameEn: true, nameTh: true, rate: true, ota: true, capacity: true },
  });

  if (rooms.length === 0) {
    return "No active rooms in the database right now.";
  }

  return rooms
    .map(
      (r) =>
        `${r.nameEn} / ${r.nameTh}: from ฿${r.rate.toLocaleString("en-US")} direct (base rate · specific dates can cost more), OTA ฿${r.ota.toLocaleString("en-US")}, sleeps ${r.capacity}`
    )
    .join(". ");
}

function configFacts(lang: "en" | "th"): string {
  const facts = hotelConfig.concierge.facts.map((f) => f[lang]).join(" ");
  const contact = hotelConfig.contact;
  return [
    `Hotel: ${hotelConfig.name}.`,
    `Tagline: ${hotelConfig.tagline[lang]}.`,
    facts,
    `Address: ${contact.address[lang]}.`,
    `Phone: ${contact.phone}. Email: ${contact.email}. LINE: ${contact.line}.`,
    `Check-in ${hotelConfig.policies.checkIn}, check-out ${hotelConfig.policies.checkOut}.`,
    `Deposit: ${hotelConfig.policies.depositPct}% to confirm.`,
    `Cancel: ${hotelConfig.policies.cancel[lang]}`,
    `Pets: ${hotelConfig.policies.pets[lang]}`,
  ].join(" ");
}

function buildSystemPrompt(
  lang: "en" | "th",
  roomFacts: string,
  availability: AvailabilityResult | null,
  availabilityFailed: boolean
): string {
  const replyLang = lang === "th" ? "Thai" : "English";
  const name = hotelConfig.concierge.name[lang];

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

  return [
    `You are ${name}, the in-house concierge for ${hotelConfig.name}.`,
    `Reply only in ${replyLang}.`,
    "Use ONLY the FACTS block below. Never invent prices, fees, room names, or amenities.",
    ...availabilityRules,
    `When the guest wants to book, hand off with this exact HTML: <a href="${linkHref}" class="font-extrabold text-blue">Book direct here</a>`,
    "Guardrails: no em-dash characters (use · or commas); no emojis; at most 120 words; warm and precise; HTML links only in the form shown above.",
    "",
    "FACTS:",
    configFacts(lang),
    `Rooms (source of truth): ${roomFacts}`,
    availability ? `\nAVAILABILITY:\n${availabilityFacts(availability)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  let body: ConciergeBody;
  try {
    body = (await req.json()) as ConciergeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const lang = resolveLang(body.lang);
  const fallback = hotelConfig.concierge.fallback[lang];

  // ── Live calendar read · runs before the model, for every dated question ──
  const intent = parseDateIntent(message, new Date(), lang);
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

  // Computed answer, ready to serve whenever the model is unavailable. It is
  // the same numbers the model would be given · the guest is never told
  // something the database did not say.
  const deterministic = availability
    ? composeAvailabilityReply(availability, lang)
    : availabilityFailed
      ? availabilityUnknownReply(lang)
      : null;

  if (!isAiConfigured()) {
    if (deterministic) {
      return NextResponse.json({
        reply: deterministic,
        source: availability ? "availability" : "availability-unknown",
      });
    }
    return NextResponse.json(
      { error: "AI not configured", fallback: true },
      { status: 503 }
    );
  }

  let roomFacts: string;
  try {
    roomFacts = await liveRoomFacts();
  } catch (e) {
    console.error("[api/concierge] room facts", e);
    return NextResponse.json({
      reply: deterministic ?? fallback,
      source: deterministic ? "availability" : "fallback",
    });
  }

  const result = await completeChat({
    system: buildSystemPrompt(lang, roomFacts, availability, availabilityFailed),
    messages: [{ role: "user", content: message }],
    timeoutMs: TIMEOUT_MS,
    maxTokens: 400,
  });

  if (!result.ok) {
    if (result.timedOut) {
      console.warn("[api/concierge] timed out after", TIMEOUT_MS, "ms");
    } else {
      console.error("[api/concierge]", result.error);
    }
    return NextResponse.json({
      reply: deterministic ?? fallback,
      source: deterministic
        ? "availability"
        : result.timedOut
          ? "timeout"
          : "fallback",
    });
  }

  return NextResponse.json({
    reply: result.text,
    source: "ai",
    provider: result.provider,
    availability: availability
      ? { checkIn: availability.checkIn, checkOut: availability.checkOut }
      : null,
  });
}
