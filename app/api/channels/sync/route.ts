import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gate, isDenied } from "@/lib/api";
import { dispatchOutbox } from "@/lib/channels/outbox";

export const dynamic = "force-dynamic";

/**
 * v15 · Outbox dispatch + sync log.
 *
 *   GET  (cron, Bearer CRON_SECRET) · push anything pending, answer with counts
 *   GET  ?log=1 (staff)             · recent outbox + inbound rows for the channels page
 *   POST (staff)                    · push now
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("log") === "1") {
    const g = await gate(req, "channels:read");
    if (isDenied(g)) return g.denied;
    const [outbox, inbound] = await Promise.all([
      prisma.outboxEvent.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.inboundEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { channel: { select: { name: true } } },
      }),
    ]);
    return NextResponse.json({
      outbox: outbox.map((o) => ({
        id: o.id,
        type: o.type,
        key: o.key,
        status: o.status,
        attempts: o.attempts,
        lastError: o.lastError,
        createdAt: o.createdAt.toISOString(),
        sentAt: o.sentAt?.toISOString() ?? null,
        payload: JSON.parse(o.payload) as unknown,
      })),
      inbound: inbound.map((i) => ({
        id: i.id,
        channel: i.channel.name,
        externalId: i.externalId,
        type: i.type,
        status: i.status,
        error: i.error,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  }

  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    const g = await gate(req, "channels:read");
    if (isDenied(g)) return g.denied;
  }
  const result = await dispatchOutbox({ budgetMs: 20000, limit: 100 });
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  const g = await gate(req, "channels:read");
  if (isDenied(g)) return g.denied;
  const result = await dispatchOutbox({ budgetMs: 15000, limit: 100 });
  return NextResponse.json({ ok: true, ...result });
}
