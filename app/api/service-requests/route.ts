import { NextResponse } from "next/server";
import { GUEST } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { limitOrReject } from "@/lib/rateLimit";
import {
  createServiceRequest,
  isRequestStatus,
  listServiceRequests,
  type RequestStatus,
} from "@/lib/serviceRequests";

export const dynamic = "force-dynamic";

/** Staff queue · ?status=new,accepted */
export async function GET(req: Request) {
  const g = await gate(req, "requests:read");
  if (isDenied(g)) return g.denied;
  const raw = new URL(req.url).searchParams.get("status");
  const status = raw
    ? (raw.split(",").filter(isRequestStatus) as RequestStatus[])
    : (["new", "accepted"] as RequestStatus[]);
  return NextResponse.json(await listServiceRequests({ status }));
}

type Body = {
  bookingCode?: string;
  bookingId?: string;
  kind?: string;
  title?: string;
  details?: string;
  due?: string;
};

/**
 * A guest (with their booking code) or a staff member files a request. The
 * concierge AI files through lib/concierge tools, tagged concierge_ai.
 */
export async function POST(req: Request) {
  const limited = limitOrReject(req, "booking");
  if (limited) return limited;
  const body = (await readJson<Body>(req)) ?? {};
  if (!body.title?.trim()) return bad("title required");
  const g = await gate(req);
  const staff = !isDenied(g) && !g.actor.sandbox ? g.actor : null;
  if (!staff && !body.bookingCode) return bad("bookingCode required");
  const result = await createServiceRequest(
    {
      bookingCode: body.bookingCode ?? null,
      bookingId: staff ? body.bookingId ?? null : null,
      kind: body.kind ?? "other",
      title: body.title,
      details: body.details,
      due: body.due,
      source: staff ? "staff" : "guest",
    },
    staff ?? GUEST
  );
  if ("error" in result) return bad(result.error, 422);
  return NextResponse.json(result, { status: 201 });
}
