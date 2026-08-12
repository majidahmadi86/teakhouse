import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  diningItemToClient,
  diningItemToDb,
  type DiningItem,
} from "@/lib/dining";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DiningItem;
    const created = await prisma.diningItem.create({
      data: diningItemToDb(body),
    });
    return NextResponse.json(diningItemToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/dining/items POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
