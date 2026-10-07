import { NextResponse } from "next/server";
import { isDemoModeServer } from "@/lib/demoReset";
import {
  clearOwnerSession,
  issueOwnerSession,
  ownerPinMatches,
  ownerSessionsAvailable,
  readOwnerSession,
} from "@/lib/ownerSession";
import { isSameOrigin } from "@/lib/sameOrigin";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/** Is there a valid owner session on this request? No DB work. */
export async function GET(req: Request) {
  const session = readOwnerSession(req);
  return NextResponse.json(
    {
      active: session !== null,
      kind: session?.kind ?? null,
      demo: isDemoModeServer(),
    },
    { headers: NO_STORE }
  );
}

/**
 * Issue an owner session. Same-origin only.
 *   { pin }  the owner PIN, verified here · a wrong PIN is 401
 *   {}       demo mode only: the demo panel opens without a PIN, so any
 *            same-origin caller gets a demo session; outside demo mode, 401
 * 503 when this deployment cannot issue sessions (no CRON_SECRET in
 * production · see lib/ownerSession.ts).
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin" }, { status: 403 });
  }
  if (!ownerSessionsAvailable(req)) {
    return NextResponse.json(
      { error: "owner-sessions-unavailable" },
      { status: 503, headers: NO_STORE }
    );
  }

  let body: { pin?: unknown } = {};
  try {
    body = (await req.json()) as { pin?: unknown };
  } catch {
    /* no body · treated as {} */
  }

  let kind: "owner" | "demo";
  if (typeof body.pin === "string") {
    if (!ownerPinMatches(body.pin)) {
      return NextResponse.json({ error: "invalid-pin" }, { status: 401 });
    }
    kind = "owner";
  } else if (isDemoModeServer()) {
    kind = "demo";
  } else {
    return NextResponse.json({ error: "pin-required" }, { status: 401 });
  }

  const res = NextResponse.json(
    { active: true, kind },
    { status: 200, headers: NO_STORE }
  );
  if (!issueOwnerSession(req, res, kind)) {
    return NextResponse.json(
      { error: "owner-sessions-unavailable" },
      { status: 503, headers: NO_STORE }
    );
  }
  return res;
}

/** Sign out · clears the cookie. */
export async function DELETE(req: Request) {
  const res = NextResponse.json({ ok: true }, { headers: NO_STORE });
  clearOwnerSession(req, res);
  return res;
}
