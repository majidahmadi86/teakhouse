import { loadOwnerData } from "@/lib/dataService";
import { maybeReseedDemo } from "@/lib/demoReset";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await maybeReseedDemo();
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
