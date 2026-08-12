import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { diningCategoryToClient } from "@/lib/dining";

export const dynamic = "force-dynamic";

/** Full menu, categories with dishes, owner view (includes unpublished). */
export async function GET() {
  const rows = await prisma.diningCategory.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(rows.map(diningCategoryToClient));
}
