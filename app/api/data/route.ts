import { NextResponse } from "next/server";
import { loadOwnerData } from "@/lib/dataService";

export const dynamic = "force-dynamic";

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
