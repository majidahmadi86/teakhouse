import { pageLang, type LangParams } from "@/lib/pageLocale";
import { decodeRouteQuery } from "@/lib/routeQuery";
import { EventReserveView } from "../../EventReserveView";

/**
 * /events/reserve with a query that changes the page (lib/routeQuery: validated
 * keys only, in a fixed order). Rendered on first request per distinct query
 * and cached (ISR), so the page never renders per request.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: LangParams & { q: string } }) {
  return EventReserveView({
    locale: pageLang(params),
    searchParams: decodeRouteQuery("/events/reserve", params.q),
  });
}
