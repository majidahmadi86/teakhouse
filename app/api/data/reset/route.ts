import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { loadOwnerData } from "@/lib/dataService";
import { prisma } from "@/lib/db";
import { revalidateAll } from "@/lib/revalidate";
import { seedDatabase } from "@/lib/seedDatabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Reset DB to seed. Used by owner reset + demo sandbox. */
export async function POST(req: Request) {
  const gate_ = await requireStaff(req, "settings:write");
  if (!gate_.ok) return gate_.response;
  try {
    await seedDatabase();
    await prisma.demoMeta.upsert({
      where: { id: "demo" },
      create: { id: "demo", lastReset: new Date() },
      update: { lastReset: new Date() },
    });
    // The reseed rewrites every table the guest pages read · drop all tags so
    // the demo does not keep serving the previous seed's menu and events.
    revalidateAll();
    const data = await loadOwnerData();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/data/reset]", e);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
