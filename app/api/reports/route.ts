import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, SYSTEM } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { generateReport } from "@/lib/analytics";
import { sendConfirmationEmail } from "@/lib/email";
import { getHotelId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * v15 · Automated reporting.
 *
 *   GET             · the last reports (staff)
 *   GET  ?cron=1    · Bearer CRON_SECRET · generate the daily report and email it
 *   POST { kind }   · generate one now (staff)
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (u.searchParams.get("cron") === "1") {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const report = await generateReport("daily");
    await emailReport(report);
    await audit(SYSTEM, "report.generated", "report", report.id, { kind: "daily", cron: true });
    return NextResponse.json({ ok: true, id: report.id });
  }
  const g = await gate(req, "analytics:read");
  if (isDenied(g)) return g.denied;
  const rows = await prisma.report.findMany({
    where: { hotelId: getHotelId() },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      createdAt: r.createdAt.toISOString(),
      summary: summarise(JSON.parse(r.payload)),
    }))
  );
}

export async function POST(req: Request) {
  const g = await gate(req, "reports:write");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<{ kind?: string; email?: boolean }>(req)) ?? {};
  const kind = body.kind === "weekly" || body.kind === "monthly" ? body.kind : "daily";
  const report = await generateReport(kind);
  if (body.email) await emailReport(report);
  await audit(g.actor, "report.generated", "report", report.id, { kind });
  return NextResponse.json({
    id: report.id,
    kind,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    createdAt: report.createdAt,
    summary: summarise(report.analytics),
    analytics: report.analytics,
  }, { status: 201 });
}

type Summary = {
  occupancyPct: number;
  adr: number;
  revpar: number;
  totalRevenue: number;
  netRevenue: number;
  bookings: number;
  directSharePct: number;
  collected: number;
};

function summarise(a: {
  occupancyPct: number;
  adr: number;
  revpar: number;
  totalRevenue: number;
  netRevenue: number;
  bookings: number;
  directSharePct: number;
  payouts: { collected: number };
}): Summary {
  return {
    occupancyPct: a.occupancyPct,
    adr: a.adr,
    revpar: a.revpar,
    totalRevenue: a.totalRevenue,
    netRevenue: a.netRevenue,
    bookings: a.bookings,
    directSharePct: a.directSharePct,
    collected: a.payouts.collected,
  };
}

async function emailReport(report: Awaited<ReturnType<typeof generateReport>>) {
  const hotel = await prisma.hotel.findUnique({ where: { id: "default" }, select: { email: true, name: true } });
  if (!hotel?.email) return;
  const s = summarise(report.analytics);
  await sendConfirmationEmail({
    to: hotel.email,
    subject: `${hotel.name} · ${report.kind} report ${report.periodStart} → ${report.periodEnd}`,
    body: [
      `Occupancy ${s.occupancyPct}% · ADR ฿${s.adr.toLocaleString("en-US")} · RevPAR ฿${s.revpar.toLocaleString("en-US")}`,
      `Revenue ฿${s.totalRevenue.toLocaleString("en-US")} · net of commission ฿${s.netRevenue.toLocaleString("en-US")}`,
      `${s.bookings} bookings · ${s.directSharePct}% direct · collected ฿${s.collected.toLocaleString("en-US")}`,
    ].join("\n"),
  });
}
