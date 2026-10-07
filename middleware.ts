import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLang, LOCALE_COOKIE, negotiateLang } from "@/lib/locales/meta";

/**
 * Two jobs, both about making the server render match the request.
 *
 * 1 · `x-pathname` exposes the request path to server components, so the
 *     zero-JS HeaderShell can highlight the active nav item exactly like the
 *     hydrated Header (VISUAL PARITY LAW · components/header/HeaderShell.tsx).
 *
 * 2 · The language: `?lang=xx` (any of the sixteen) > the `tkh-lang` cookie >
 *     the browser's Accept-Language. A parameter or a first-visit negotiation
 *     is promoted into the cookie FOR THIS REQUEST, before any page or
 *     generateMetadata runs, and persisted on the response. The site has no
 *     locale path prefix, so a share-preview crawler (no cookies) would
 *     otherwise always be served English: a link with ?lang=ja previews in
 *     Japanese, and a visitor following it keeps the language.
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);

  const param = req.nextUrl.searchParams.get("lang");
  const existing = req.cookies.get(LOCALE_COOKIE)?.value;
  const lang = isLang(param)
    ? param
    : isLang(existing)
      ? null
      : negotiateLang(req.headers.get("accept-language"));

  if (lang) {
    // Rewrite the Cookie header the render will read. Building the header by
    // hand rather than mutating req.cookies keeps this independent of how a
    // given Next version serialises the jar.
    const jar = req.cookies
      .getAll()
      .filter((c) => c.name !== LOCALE_COOKIE)
      .map((c) => `${c.name}=${c.value}`);
    jar.push(`${LOCALE_COOKIE}=${lang}`);
    headers.set("cookie", jar.join("; "));
  }

  const res = NextResponse.next({ request: { headers } });

  if (lang && lang !== existing) {
    // Persist it, so navigating away from the shared link stays in language.
    res.cookies.set(LOCALE_COOKIE, lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  // Skip static assets and API · only page routes need this.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
