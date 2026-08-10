import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { SeasonalPriceRuleDto } from "@/lib/ownerTypes";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

function toDto(row: {
  id: string;
  roomId: string;
  label: string;
  startDate: string;
  endDate: string;
  multiplier: number;
}): SeasonalPriceRuleDto {
  return {
    id: row.id,
    roomId: row.roomId,
    label: row.label,
    startDate: row.startDate,
    endDate: row.endDate,
    multiplier: row.multiplier,
  };
}

async function resolveRoom(idOrSlug: string) {
  return prisma.room.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
}

export async function GET(_req: Request, { params }: Ctx) {
  const room = await resolveRoom(params.id);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  const rows = await prisma.seasonalPriceRule.findMany({
    where: { roomId: room.id },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(rows.map(toDto));
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const room = await resolveRoom(params.id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const body = (await req.json()) as {
      label?: string;
      startDate?: string;
      endDate?: string;
      multiplier?: number;
    };
    if (!body.startDate || !body.endDate || typeof body.multiplier !== "number") {
      return NextResponse.json(
        { error: "startDate, endDate, and multiplier are required" },
        { status: 400 }
      );
    }
    if (body.multiplier <= 0) {
      return NextResponse.json(
        { error: "multiplier must be positive" },
        { status: 400 }
      );
    }
    const created = await prisma.seasonalPriceRule.create({
      data: {
        roomId: room.id,
        label: body.label?.trim() ?? "",
        startDate: body.startDate,
        endDate: body.endDate,
        multiplier: body.multiplier,
      },
    });
    return NextResponse.json(toDto(created), { status: 201 });
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
    const body = (await req.json()) as {
      id?: string;
      label?: string;
      startDate?: string;
      endDate?: string;
      multiplier?: number;
    };
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const existing = await prisma.seasonalPriceRule.findFirst({
      where: { id: body.id, roomId: room.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    if (typeof body.multiplier === "number" && body.multiplier <= 0) {
      return NextResponse.json(
        { error: "multiplier must be positive" },
        { status: 400 }
      );
    }
    const updated = await prisma.seasonalPriceRule.update({
      where: { id: existing.id },
      data: {
        label: body.label ?? existing.label,
        startDate: body.startDate ?? existing.startDate,
        endDate: body.endDate ?? existing.endDate,
        multiplier:
          typeof body.multiplier === "number"
            ? body.multiplier
            : existing.multiplier,
      },
    });
    return NextResponse.json(toDto(updated));
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
