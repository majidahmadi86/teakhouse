import { NextResponse } from "next/server";
import { gate, isDenied } from "@/lib/api";
import { analyticsToCsv, computeAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

/** v15 · Executive numbers · ?from=yyyy-mm-dd&to=yyyy-mm-dd&format=csv */
export async function GET(req: Request) {
  const g = await gate(req, "analytics:read");
  if (isDenied(g)) return g.denied;
  const u = new URL(req.url);
  const analytics = await computeAnalytics({
    from: u.searchParams.get("from") ?? undefined,
    to: u.searchParams.get("to") ?? undefined,
  });
  if (u.searchParams.get("format") === "csv") {
    return new NextResponse(analyticsToCsv(analytics), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="teakhouse-${analytics.from}-${analytics.to}.csv"`,
      },
    });
  }
  return NextResponse.json(analytics, { headers: { "cache-control": "private, max-age=30" } });
}
