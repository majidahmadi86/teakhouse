import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  diningItemToClient,
  diningItemToDb,
  type DiningItem,
} from "@/lib/dining";
import { revalidateDining } from "@/lib/revalidate";
import { requireOwner } from "@/lib/ownerSession";
import { readOnlyResponse } from "@/lib/readOnly";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
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
