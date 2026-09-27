import { NextResponse } from "next/server";
import { requireStaff, type StaffActor } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/rbac";

/**
 * v15 · Route-handler helpers · keep every handler to the same three lines.
 */

export type Gate = { actor: StaffActor } | { denied: NextResponse };

export async function gate(req: Request, permission?: Permission): Promise<Gate> {
  const g = await requireStaff(req, permission);
  return g.ok ? { actor: g.actor } : { denied: g.response };
}

export function isDenied(g: Gate): g is { denied: NextResponse } {
  return "denied" in g;
}

export function bad(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/** Public GET responses that may sit on the CDN for a while. */
export function cachedJson(body: unknown, seconds: number, extra: HeadersInit = {}): NextResponse {
  return NextResponse.json(body, {
    headers: {
      "cache-control": `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`,
      ...extra,
    },
  });
}
