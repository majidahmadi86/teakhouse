import { NextResponse } from "next/server";
import { hotelConfig } from "@/config/hotel.config";
import { completeChat, isAiConfigured } from "@/lib/ai";
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
        `${r.nameEn} / ${r.nameTh}: direct ฿${r.rate.toLocaleString("en-US")}, OTA ฿${r.ota.toLocaleString("en-US")}, sleeps ${r.capacity}`
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

function buildSystemPrompt(lang: "en" | "th", roomFacts: string): string {
  const replyLang = lang === "th" ? "Thai" : "English";
  const name = hotelConfig.concierge.name[lang];

  return [
    `You are ${name}, the in-house concierge for ${hotelConfig.name}.`,
    `Reply only in ${replyLang}.`,
    "Use ONLY the FACTS block below. Never invent prices, fees, room names, or amenities.",
    "If a price is not in FACTS, say you will confirm with the house and offer to help with booking.",
    'When the guest wants to book or check dates, hand off to /book with this exact HTML: <a href="/book" class="font-extrabold text-blue">Book direct here</a>',
    "Guardrails: no em-dash characters (use · or commas); no emojis; at most 120 words; warm and precise; HTML links only in the form shown above.",
    "",
    "FACTS:",
    configFacts(lang),
    `Live rooms and prices (source of truth): ${roomFacts}`,
  ].join("\n");
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

  if (!isAiConfigured()) {
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
    return NextResponse.json({ reply: fallback, source: "fallback" });
  }

  const result = await completeChat({
    system: buildSystemPrompt(lang, roomFacts),
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
      reply: fallback,
      source: result.timedOut ? "timeout" : "fallback",
    });
  }

  return NextResponse.json({
    reply: result.text,
    source: "ai",
    provider: result.provider,
  });
}
