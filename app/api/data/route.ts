import { loadOwnerData } from "@/lib/dataService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Read-only. /book, /account and /owner all fetch this on mount, so it must
 * never write: it used to touch the DemoMeta marker and reseed the whole
 * database inline when the marker was over an hour old. The reseed now runs
 * only from the authenticated cron (app/api/cron/reseed).
 */
export async function GET() {
  try {
    const data = await loadOwnerData();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/data]", e);
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}
