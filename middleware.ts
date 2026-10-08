import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLang, LOCALE_COOKIE, negotiateLang, type Lang } from "@/lib/locales/meta";
import { encodeRouteQuery, isQueryRoute } from "@/lib/routeQuery";
import { parseStay, stayToSegments } from "@/lib/stayDate";

const YEAR = 60 * 60 * 24 * 365;

/**
 * Every guest page is static (or ISR) per language, rendered under an
 * internal locale segment: app/[lang]/(guest)/... and app/[lang]/(marketing).
 * This middleware decides the language and REWRITES to that segment; the
 * address bar never changes (/rooms stays /rooms).
 *
 * 1 · The language: `?lang=xx` (any of the sixteen) > the `tkh-lang` cookie >
 *     the browser's Accept-Language. A parameter or a first-visit negotiation
 *     is pinned as the cookie, so the language menu is the only thing that
 *     changes it afterwards. A share-preview crawler (no cookies) following a
 *     ?lang=ja link gets Japanese.
 *
 * 2 · /book: the stay in the query (in, out, g, room from the booking bar's
 *     GET form) is validated here (lib/stayDate) and becomes path segments,
 *     /<lang>/book/<in>/<out>/<g>[/<room>]; with no stay, tomorrow on the
 *     hotel's clock is computed HERE, at request time. So /book reads its stay
 *     on the server, renders statically per stay, and never freezes a date.
 *
 * 3 · The form pages whose content follows their query (/contact,
 *     /dining/reserve, /events/reserve) get it as one validated segment
 *     (lib/routeQuery).
 *
 * 4 · /owner is not a guest page: it keeps its own root layout and reads the
 *     cookie itself; only ?lang is promoted for it, as before.
 *
 * A request already under a locale segment (/th/rooms) is redirected to the
 * plain address with ?lang=th, so the internal paths are never public URLs.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const param = searchParams.get("lang");
  const existing = req.cookies.get(LOCALE_COOKIE)?.value;

  if (pathname === "/owner" || pathname.startsWith("/owner/")) {
    const res = NextResponse.next();
    if (isLang(param) && param !== existing) pin(res, param);
    return res;
  }

  const first = pathname.split("/")[1] ?? "";
  if (isLang(first)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(first.length + 1) || "/";
    url.searchParams.set("lang", first);
    return NextResponse.redirect(url, 307);
  }

  const lang: Lang = isLang(param)
    ? param
    : isLang(existing)
      ? existing
      : negotiateLang(req.headers.get("accept-language"));

  const url = req.nextUrl.clone();
  const path = pathname === "/" ? "" : pathname.replace(/\/+$/, "");

  if (path === "/book") {
    const stay = parseStay({
      in: searchParams.get("in"),
      out: searchParams.get("out"),
      g: searchParams.get("g"),
      room: searchParams.get("room"),
    });
    url.pathname = `/${lang}/book/${stayToSegments(stay).join("/")}`;
  } else if (isQueryRoute(path)) {
    const q = encodeRouteQuery(path, searchParams);
    url.pathname = q ? `/${lang}${path}/q/${q}` : `/${lang}${path}`;
  } else {
    url.pathname = `/${lang}${path}`;
  }

  const res = NextResponse.rewrite(url);
  if (lang !== existing) pin(res, lang);
  return res;
}

function pin(res: NextResponse, lang: Lang) {
  res.cookies.set(LOCALE_COOKIE, lang, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

export const config = {
  // Page routes only · never the API, Next's assets, or files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
