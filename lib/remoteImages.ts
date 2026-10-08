/* Client-safe and tiny: SafeImage imports it, so it must not pull in the
   registry data (lib/images.generated.ts). */

/**
 * Remote photographs (Unsplash, hotlinked since v7) that no longer exist
 * upstream: each answers 404, which is a console error on every page that
 * shows it. Until Phase 4 replaces the remote photography, each is mapped to
 * a live photo of the same kind already used on the site. Applied by
 * SafeImage, so it also covers the rows the seed wrote to the database.
 */
const RETIRED: Record<string, string> = {
  // River Loft
  "photo-1566665797739-1674de466a3a": "photo-1590490360182-c33d57733427",
  "photo-1611892440508-40a792e6e403": "photo-1618773928121-c32242e63f39",
  // Garden Room
  "photo-1591087917153-872378c177a2": "photo-1560448204-e02f11c3d0e2",
  "photo-1595526114035-0d45ed16c565": "photo-1582719508461-905c673771fd",
  "photo-1571008887538-b36bb74556e6": "photo-1540518614846-7eded433c457",
  // Courtyard Twin
  "photo-1598928502111-a684ea7036fb": "photo-1631049307264-da0ec9d70304",
  "photo-1560185127-8726d12649a8": "photo-1618773928121-c32242e63f39",
  "photo-1584133760887-c4244e998f6c": "photo-1590490360182-c33d57733427",
  "photo-1615874959477-2f584629a619": "photo-1611892440504-42a792e24d32",
  "photo-1522771739844-47449f1b1172": "photo-1600566752355-35792bedcfea",
  // Poolside Hide (seeded rooms)
  "photo-1584132915807-fd1f5fbc076f": "photo-1584132967334-10e028bd69f7",
};

export function liveRemote(src: string): string {
  if (!src.includes("images.unsplash.com")) return src;
  const m = /photo-[0-9]+-[0-9a-f]+/.exec(src);
  const to = m ? RETIRED[m[0]] : undefined;
  return to ? src.replace(m![0], to) : src;
}
