import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { enqueueOutboxNow } from "@/lib/channels/outbox";
import { getHotelId } from "@/lib/tenant";
import { toYieldRule, type YieldRule } from "@/lib/yield";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const g = await gate(req, "rates:write");
  if (isDenied(g)) return g.denied;
  const rows = await prisma.yieldRule.findMany({ where: { hotelId: getHotelId() }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(rows.map(toYieldRule));
}

type Body = Partial<YieldRule> & { id?: string; delete?: boolean };

function validate(b: Body): string | null {
  if (b.kind && !["occupancy", "lead_time", "min_stay"].includes(b.kind)) return "bad kind";
  if (b.startDate && !ISO.test(b.startDate)) return "bad startDate";
  if (b.endDate && !ISO.test(b.endDate)) return "bad endDate";
  if (typeof b.multiplier === "number" && (b.multiplier < 0.5 || b.multiplier > 2)) return "multiplier must be 0.5–2.0";
  return null;
}

/** POST creates, or updates/deletes when `id` is given. */
export async function POST(req: Request) {
  const g = await gate(req, "rates:write");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<Body>(req)) ?? {};
  const err = validate(body);
  if (err) return bad(err);

  if (body.id && body.delete) {
    await prisma.yieldRule.delete({ where: { id: body.id } }).catch(() => undefined);
    await audit(g.actor, "yield.deleted", "yieldRule", body.id);
    return NextResponse.json({ ok: true });
  }

  const data = {
    roomId: body.roomId ?? null,
    kind: body.kind ?? "occupancy",
    label: (body.label ?? "").slice(0, 80),
    threshold: typeof body.threshold === "number" ? body.threshold : 0,
    maxLeadDays: typeof body.maxLeadDays === "number" ? body.maxLeadDays : null,
    multiplier: typeof body.multiplier === "number" ? body.multiplier : 1,
    minNights: typeof body.minNights === "number" ? Math.max(1, Math.round(body.minNights)) : 1,
    startDate: body.startDate ?? null,
    endDate: body.endDate ?? null,
    enabled: body.enabled ?? true,
  };

  const row = body.id
    ? await prisma.yieldRule.update({ where: { id: body.id }, data })
    : await prisma.yieldRule.create({ data: { ...data, hotelId: getHotelId() } });
  await audit(g.actor, body.id ? "yield.updated" : "yield.created", "yieldRule", row.id, { kind: row.kind });
  await enqueueOutboxNow("rate.changed", `yield:${row.id}:${row.updatedAt.getTime()}`, {
    reason: "yield.rule",
    dates: [],
  });
  return NextResponse.json(toYieldRule(row), { status: body.id ? 200 : 201 });
}
