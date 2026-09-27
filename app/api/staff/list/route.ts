import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gate, isDenied } from "@/lib/api";
import { getHotelId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/** v15 · Staff roster · owner only, never the password hashes. */
export async function GET(req: Request) {
  const g = await gate(req, "staff:write");
  if (isDenied(g)) return g.denied;
  const rows = await prisma.staffUser.findMany({
    where: { hotelId: getHotelId() },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true },
  });
  return NextResponse.json(rows.map((r) => ({ ...r, lastLoginAt: r.lastLoginAt?.toISOString() ?? null })));
}
