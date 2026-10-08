import { pageLang, type LangParams } from "@/lib/pageLocale";
import { ReserveView } from "./ReserveView";

/**
 * /dining/reserve with no query · static per language, refreshed hourly (ISR) and
 * at once on an owner edit (its reads are tag-invalidated). A query that
 * changes the page (lib/routeQuery) is rewritten by the middleware to
 * ./q/[q], which renders the same view once per distinct query.
 */
export const revalidate = 3600;

export default async function Page({ params }: { params: LangParams }) {
  return ReserveView({ locale: pageLang(params), searchParams: {} });
}
