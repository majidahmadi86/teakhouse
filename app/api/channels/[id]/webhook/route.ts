import { NextResponse } from "next/server";
import { processInbound } from "@/lib/channels/inbound";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER } from "@/lib/channels/signing";
import { limitOrReject } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * v15 · Inbound reservations from a channel · signed, idempotent, and refused
 * with 409 + alternatives when the last unit is already sold.
 */
export async function POST(req: Request, { params }: Ctx) {
  const limited = limitOrReject(req, "webhook");
  if (limited) return limited;
  const raw = await req.text();
  const result = await processInbound(params.id, raw, {
    signature: req.headers.get(SIGNATURE_HEADER),
    timestamp: req.headers.get(TIMESTAMP_HEADER),
  });
  return NextResponse.json(result.body, { status: result.status });
}
