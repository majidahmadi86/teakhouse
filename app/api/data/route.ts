import { loadOwnerData } from "@/lib/dataService";
import { maybeReseedDemo } from "@/lib/demoReset";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // A failed reseed must not cost the caller its data · serving slightly
    // stale demo rows beats dropping the client back to base-rate seed data.
    try {
      await maybeReseedDemo();
    } catch (e) {
      console.error("[api/data] reseed skipped", e);
    }
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
