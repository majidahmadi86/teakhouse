import { NextResponse } from "next/server";
import { getRates } from "@/lib/fx";

/**
 * Live exchange table (THB base, ECB reference rates through Frankfurter).
 * Read-only. lib/fx caches the upstream answer for an hour and never caches a
 * failure; browsers and the CDN may keep this response for ten minutes.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const table = await getRates();
  return NextResponse.json(table, {
    headers: {
      "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
