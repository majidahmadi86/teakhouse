import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  diningCategoryToClient,
  diningCategoryToDb,
  type DiningCategory,
} from "@/lib/dining";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Omit<DiningCategory, "items">;
    const created = await prisma.diningCategory.create({
      data: { hotelId: "default", ...diningCategoryToDb(body) },
      include: { items: true },
    });
    return NextResponse.json(diningCategoryToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/dining/categories POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
