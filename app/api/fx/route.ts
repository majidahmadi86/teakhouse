import { cachedJson } from "@/lib/api";
import { getRates } from "@/lib/fx";

export const dynamic = "force-dynamic";

/** v15 · Live exchange table (THB base) · CDN-cacheable for 10 minutes. */
export async function GET() {
  const table = await getRates();
  return cachedJson(table, 600);
}
