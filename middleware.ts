import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Exposes the request pathname to server components via the `x-pathname`
 * request header · lets the zero-JS HeaderShell highlight the active nav item
 * exactly like the hydrated Header, so the two are pixel-identical on every
 * route (VISUAL PARITY LAW · see components/header/HeaderShell.tsx).
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip static assets and API · only page routes need the pathname header.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
