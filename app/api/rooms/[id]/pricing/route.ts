import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPriceRule } from "@/lib/pricing";
import type { SeasonalPriceRuleDto } from "@/lib/ownerTypes";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

type RuleBody = {
  id?: string;
  kind?: string;
  label?: string;
  startDate?: string;
  endDate?: string;
  multiplier?: number | null;
  price?: number | null;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

async function resolveRoom(idOrSlug: string) {
  return prisma.room.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
}

/** A rule must price a night somehow · fixed price or multiplier, one of them. */
function validate(body: RuleBody, partial: boolean): string | null {
  if (!partial) {
    if (!body.startDate || !body.endDate) {
      return "startDate and endDate are required";
    }
    const hasPrice = typeof body.price === "number";
    const hasMult = typeof body.multiplier === "number";
    if (!hasPrice && !hasMult) {
      return "either price or multiplier is required";
    }
  }
  if (body.startDate && !ISO.test(body.startDate)) {
    return "startDate must be yyyy-mm-dd";
  }
  if (body.endDate && !ISO.test(body.endDate)) {
    return "endDate must be yyyy-mm-dd";
  }
  if (body.startDate && body.endDate && body.endDate < body.startDate) {
    return "endDate must not be before startDate";
  }
  if (typeof body.multiplier === "number" && body.multiplier <= 0) {
    return "multiplier must be positive";
  }
  if (typeof body.price === "number" && body.price <= 0) {
    return "price must be positive";
  }
  if (body.kind && body.kind !== "season" && body.kind !== "override") {
    return "kind must be season or override";
  }
  return null;
}

export async function GET(_req: Request, { params }: Ctx) {
  const room = await resolveRoom(params.id);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  const rows = await prisma.seasonalPriceRule.findMany({
    where: { roomId: room.id },
    orderBy: [{ kind: "asc" }, { startDate: "asc" }],
  });
  return NextResponse.json(rows.map(toPriceRule) satisfies SeasonalPriceRuleDto[]);
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const room = await resolveRoom(params.id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const body = (await req.json()) as RuleBody;
    const error = validate(body, false);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const created = await prisma.seasonalPriceRule.create({
      data: {
        roomId: room.id,
        kind: body.kind === "override" ? "override" : "season",
        label: body.label?.trim() ?? "",
        startDate: body.startDate!,
        endDate: body.endDate!,
        multiplier: typeof body.multiplier === "number" ? body.multiplier : null,
        price: typeof body.price === "number" ? Math.round(body.price) : null,
      },
    });
    return NextResponse.json(toPriceRule(created), { status: 201 });
  } catch (e) {
    console.error("[api/rooms pricing POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const room = await resolveRoom(params.id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const body = (await req.json()) as RuleBody;
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const error = validate(body, true);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const existing = await prisma.seasonalPriceRule.findFirst({
      where: { id: body.id, roomId: room.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const updated = await prisma.seasonalPriceRule.update({
      where: { id: existing.id },
      data: {
        kind: body.kind === "override" || body.kind === "season" ? body.kind : existing.kind,
        label: body.label ?? existing.label,
        startDate: body.startDate ?? existing.startDate,
        endDate: body.endDate ?? existing.endDate,
        // null clears the field · undefined leaves it alone
        multiplier: body.multiplier === undefined ? existing.multiplier : body.multiplier,
        price:
          body.price === undefined
            ? existing.price
            : body.price === null
              ? null
              : Math.round(body.price),
      },
    });
    return NextResponse.json(toPriceRule(updated));
  } catch (e) {
    console.error("[api/rooms pricing PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const room = await resolveRoom(params.id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const url = new URL(req.url);
    let ruleId = url.searchParams.get("id");
    if (!ruleId) {
      try {
        const body = (await req.json()) as { id?: string };
        ruleId = body.id ?? null;
      } catch {
        /* no body */
      }
    }
    if (!ruleId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const existing = await prisma.seasonalPriceRule.findFirst({
      where: { id: ruleId, roomId: room.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    await prisma.seasonalPriceRule.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/rooms pricing DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
