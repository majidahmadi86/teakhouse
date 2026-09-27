import { cachedJson } from "@/lib/api";
import { addonToClient } from "@/lib/addons";
import { getPublicRates } from "@/lib/cachedData";
import { roomToClient } from "@/lib/mappers";
import { toPriceRule } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * v15 · Rooms, rate rules and packages for the guest side · no bookings,
 * no guests. Tag-invalidated with every owner room/rate write.
 */
export async function GET() {
  const { rooms, rules, addons } = await getPublicRates();
  return cachedJson(
    {
      rooms: rooms.map((r) => ({ ...roomToClient(r), units: r.units })),
      priceRules: rules.map(toPriceRule),
      addons: addons.map(addonToClient),
    },
    60
  );
}
