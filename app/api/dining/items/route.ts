import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  diningItemToClient,
  diningItemToDb,
  type DiningItem,
} from "@/lib/dining";
import { revalidateDining } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate_ = await requireStaff(req, "content:write");
  if (!gate_.ok) return gate_.response;
  try {
    const body = (await req.json()) as DiningItem;
    const created = await prisma.diningItem.create({
      data: diningItemToDb(body),
    });
    revalidateDining();
    return NextResponse.json(diningItemToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/dining/items POST]", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
