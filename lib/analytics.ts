import { prisma } from "@/lib/db";
import { addDaysIso, eachNightIso, nightsBetweenIso } from "@/lib/pricing";
import { getHotelId } from "@/lib/tenant";
import { hotelTodayIso } from "@/lib/utils";

/**
 * v15 · Executive analytics · server only, one read per request.
 *
 * Revenue is allocated per night (a stay spanning two months contributes to
 * both), every metric counts UNITS not room types, and OTA commission is what
 * the connected channel is configured to take. Definitions:
 *
 *   occupancy = sold room-nights / available room-nights
 *   ADR       = room revenue / sold room-nights
 *   RevPAR    = room revenue / available room-nights  (= ADR × occupancy)
 */

export type ChannelMix = { source: string; bookings: number; revenue: number; commission: number };

export type DayPoint = { date: string; sold: number; available: number; revenue: number; occupancy: number };

export type Analytics = {
  from: string;
  to: string;
  days: number;
  totalUnits: number;
  roomNightsAvailable: number;
  roomNightsSold: number;
  occupancyPct: number;
  roomRevenue: number;
  packagesRevenue: number;
  totalRevenue: number;
  adr: number;
  revpar: number;
  bookings: number;
  directSharePct: number;
  channelMix: ChannelMix[];
  commissionCost: number;
  netRevenue: number;
  payouts: {
    collected: number;
    pendingWire: number;
    outstanding: number;
    byProvider: { provider: string; amount: number; count: number }[];
  };
  pickup7d: { bookings: number; revenue: number };
  forecast30d: { occupancyPct: number; revenue: number };
  series: DayPoint[];
  generatedAt: string;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function computeAnalytics(range: { from?: string; to?: string } = {}): Promise<Analytics> {
  const today = hotelTodayIso();
  const from = range.from && ISO.test(range.from) ? range.from : today.slice(0, 8) + "01";
  const to = range.to && ISO.test(range.to) && range.to > from ? range.to : addDaysIso(from, 30);
  const days = nightsBetweenIso(from, to);
  const forecastEnd = addDaysIso(today, 30);
  const windowEnd = to > forecastEnd ? to : forecastEnd;

  const hotelId = getHotelId();
  const [rooms, bookings, payments, channels, recent] = await Promise.all([
    prisma.room.findMany({ where: { hotelId, active: true }, select: { units: true, slug: true, ota: true, rate: true } }),
    prisma.booking.findMany({
      where: { hotelId, status: { not: "cancelled" }, checkIn: { lt: windowEnd }, checkOut: { gt: from } },
      select: {
        id: true,
        roomSlug: true,
        checkIn: true,
        checkOut: true,
        amount: true,
        packagesAmount: true,
        source: true,
        paidAmount: true,
        paymentStatus: true,
        channelId: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where: { booking: { hotelId }, createdAt: { gte: new Date(Date.parse(from + "T00:00:00Z") - 86_400_000 * 45) } },
      select: { provider: true, amount: true, status: true, booking: { select: { checkIn: true, checkOut: true } } },
    }),
    prisma.channel.findMany({ where: { hotelId }, select: { id: true, name: true, commissionPct: true } }),
    prisma.booking.count({
      where: { hotelId, status: { not: "cancelled" }, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    }),
  ]);

  const totalUnits = rooms.reduce((s, r) => s + Math.max(1, r.units), 0);
  const commissionFor = (b: { source: string; channelId: string | null }): number => {
    const ch = channels.find((c) => c.id === b.channelId || c.name === b.source);
    if (ch) return ch.commissionPct / 100;
    if (b.source === "Direct") return 0;
    return 0.15; // an unconnected OTA source · the industry default
  };

  // Per-night allocation across the reporting range.
  const perDay = new Map<string, DayPoint>();
  for (const d of eachNightIso(from, to)) perDay.set(d, { date: d, sold: 0, available: totalUnits, revenue: 0, occupancy: 0 });
  let roomRevenue = 0;
  let packagesRevenue = 0;
  let roomNightsSold = 0;
  let inRange = 0;
  const mix = new Map<string, ChannelMix>();
  let commissionCost = 0;
  let forecastSold = 0;
  let forecastRevenue = 0;
  const forecastDays = nightsBetweenIso(today, forecastEnd);

  for (const b of bookings) {
    const nights = eachNightIso(b.checkIn, b.checkOut);
    const perNight = nights.length ? b.amount / nights.length : 0;
    let touched = false;
    for (const n of nights) {
      const point = perDay.get(n);
      if (point) {
        point.sold += 1;
        point.revenue += perNight;
        roomRevenue += perNight;
        roomNightsSold += 1;
        touched = true;
      }
      if (n >= today && n < forecastEnd) {
        forecastSold += 1;
        forecastRevenue += perNight;
      }
    }
    if (!touched) continue;
    inRange += 1;
    const share = nights.filter((n) => perDay.has(n)).length / Math.max(1, nights.length);
    packagesRevenue += b.packagesAmount * share;
    const m = mix.get(b.source) ?? { source: b.source, bookings: 0, revenue: 0, commission: 0 };
    m.bookings += 1;
    m.revenue += b.amount * share;
    const c = b.amount * share * commissionFor(b);
    m.commission += c;
    commissionCost += c;
    mix.set(b.source, m);
  }

  const series = Array.from(perDay.values()).map((p) => ({
    ...p,
    revenue: Math.round(p.revenue),
    occupancy: p.available ? Math.round((p.sold / p.available) * 100) : 0,
  }));
  const roomNightsAvailable = totalUnits * days;
  const occupancyPct = roomNightsAvailable ? Math.round((roomNightsSold / roomNightsAvailable) * 1000) / 10 : 0;
  const adr = roomNightsSold ? Math.round(roomRevenue / roomNightsSold) : 0;
  const revpar = roomNightsAvailable ? Math.round(roomRevenue / roomNightsAvailable) : 0;
  const direct = mix.get("Direct")?.bookings ?? 0;

  // Payouts · what has actually been collected, what is promised, what is owed.
  const byProvider = new Map<string, { provider: string; amount: number; count: number }>();
  let collected = 0;
  for (const p of payments) {
    if (p.status !== "succeeded") continue;
    if (p.booking.checkOut <= from || p.booking.checkIn >= to) continue;
    collected += p.amount;
    const row = byProvider.get(p.provider) ?? { provider: p.provider, amount: 0, count: 0 };
    row.amount += p.amount;
    row.count += 1;
    byProvider.set(p.provider, row);
  }
  const inRangeBookings = bookings.filter((b) => b.checkIn < to && b.checkOut > from);
  const pendingWire = inRangeBookings
    .filter((b) => b.paymentStatus === "pending_wire")
    .reduce((s, b) => s + b.amount + b.packagesAmount - b.paidAmount, 0);
  const outstanding = inRangeBookings.reduce(
    (s, b) => s + Math.max(0, b.amount + b.packagesAmount - b.paidAmount),
    0
  );

  const pickupRevenue = bookings
    .filter((b) => b.createdAt.getTime() >= Date.now() - 7 * 86_400_000)
    .reduce((s, b) => s + b.amount, 0);

  return {
    from,
    to,
    days,
    totalUnits,
    roomNightsAvailable,
    roomNightsSold,
    occupancyPct,
    roomRevenue: Math.round(roomRevenue),
    packagesRevenue: Math.round(packagesRevenue),
    totalRevenue: Math.round(roomRevenue + packagesRevenue),
    adr,
    revpar,
    bookings: inRange,
    directSharePct: inRange ? Math.round((direct / inRange) * 100) : 0,
    channelMix: Array.from(mix.values())
      .map((m) => ({ ...m, revenue: Math.round(m.revenue), commission: Math.round(m.commission) }))
      .sort((a, b) => b.revenue - a.revenue),
    commissionCost: Math.round(commissionCost),
    netRevenue: Math.round(roomRevenue + packagesRevenue - commissionCost),
    payouts: {
      collected,
      pendingWire,
      outstanding,
      byProvider: Array.from(byProvider.values()).sort((a, b) => b.amount - a.amount),
    },
    pickup7d: { bookings: recent, revenue: Math.round(pickupRevenue) },
    forecast30d: {
      occupancyPct: totalUnits && forecastDays ? Math.round((forecastSold / (totalUnits * forecastDays)) * 1000) / 10 : 0,
      revenue: Math.round(forecastRevenue),
    },
    series,
    generatedAt: new Date().toISOString(),
  };
}

/** Render + store a report row · daily/weekly/monthly windows ending today. */
export async function generateReport(kind: "daily" | "weekly" | "monthly") {
  const today = hotelTodayIso();
  const from = kind === "daily" ? addDaysIso(today, -1) : kind === "weekly" ? addDaysIso(today, -7) : addDaysIso(today, -30);
  const analytics = await computeAnalytics({ from, to: today });
  const row = await prisma.report.create({
    data: {
      hotelId: getHotelId(),
      kind,
      periodStart: from,
      periodEnd: today,
      payload: JSON.stringify(analytics),
    },
  });
  return { id: row.id, kind, periodStart: from, periodEnd: today, analytics, createdAt: row.createdAt.toISOString() };
}

export function analyticsToCsv(a: Analytics): string {
  const head = "date,sold,available,occupancy_pct,revenue_thb";
  const rows = a.series.map((p) => `${p.date},${p.sold},${p.available},${p.occupancy},${p.revenue}`);
  const summary = [
    "",
    "metric,value",
    `period,${a.from} to ${a.to}`,
    `occupancy_pct,${a.occupancyPct}`,
    `adr_thb,${a.adr}`,
    `revpar_thb,${a.revpar}`,
    `room_revenue_thb,${a.roomRevenue}`,
    `packages_revenue_thb,${a.packagesRevenue}`,
    `commission_cost_thb,${a.commissionCost}`,
    `net_revenue_thb,${a.netRevenue}`,
    `direct_share_pct,${a.directSharePct}`,
    `collected_thb,${a.payouts.collected}`,
    `outstanding_thb,${a.payouts.outstanding}`,
  ];
  return [head, ...rows, ...summary].join("\n");
}
