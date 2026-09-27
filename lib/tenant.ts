/**
 * v15 · Property resolution · the multi-property seam.
 *
 * Every table that belongs to a property carries `hotelId`, and every service
 * asks this function which property it is working for. One deployment serves
 * one property today (PROPERTY_ID, default "default"); a portfolio deployment
 * resolves it from the request host instead · the data model and the services
 * do not change, only this function does.
 */

export function getHotelId(): string {
  return process.env.PROPERTY_ID?.trim() || "default";
}

/** Host → property, for a portfolio deployment. Falls back to the env default. */
export function hotelIdForHost(host: string | null | undefined): string {
  const map = process.env.PROPERTY_HOSTS; // "teakhouse.example=default,villa.example=villa"
  if (!map || !host) return getHotelId();
  for (const pair of map.split(",")) {
    const [h, id] = pair.split("=").map((s) => s.trim());
    if (h && id && host.toLowerCase().startsWith(h.toLowerCase())) return id;
  }
  return getHotelId();
}
