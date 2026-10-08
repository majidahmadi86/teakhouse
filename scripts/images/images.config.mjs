/**
 * The images the registry knows · input to scripts/images/build-images.mjs.
 *
 * Phase 1 (architecture) registers the house's existing local photography as
 * it is: the pre-encoded variants are copied byte for byte under content-hashed
 * names, so nothing is re-compressed and nothing looks different. Phase 4
 * (imagery) replaces entries with `{ id, master: "path/to/master.jpg", widths:
 * [...] }` and the same builder encodes them; every page that shows an image by
 * its id picks the new one up with no code change.
 */

const both = (prefix, names, widths) =>
  names.map((name) => ({
    id: `${prefix}/${name}`,
    variants: widths.flatMap((w) =>
      ["avif", "webp"].map((ext) => ({ file: `images/${prefix}/${name}-${w}.${ext}` }))
    ),
  }));

export const IMAGES = [
  // The home hero (the LCP) and the /rooms hero. Only AVIF existed; the
  // builder adds the WebP fallback.
  {
    id: "hero/home",
    variants: [
      { file: "hero-lcp-640.avif" },
      { file: "hero-lcp-828.avif" },
      { file: "hero-lcp-1920.avif" },
    ],
  },
  { id: "contact/hero", variants: [{ file: "images/contact-hero.avif" }, { file: "images/contact-hero.webp" }] },
  ...both("dining", ["hero", "breakfast", "thai-kitchen", "drinks", "reserve"], [640, 1280]),
  ...both("events", ["hero", "pavilion-dinner", "celebration-table", "string-lights"], [640, 1280]),
  ...both(
    "facilities",
    ["pool", "pier-breakfast", "courtyard-garden", "lobby-lounge", "airport-transfer", "housekeeping", "luggage-storage"],
    [640, 1280]
  ),
  ...both("house", ["story", "front-desk", "concierge-desk", "housekeeping-team", "kitchen"], [640, 1280]),
  ...both(
    "dishes",
    [
      "rice-soup", "crab-omelette", "fruit-tray", "coconut-pancakes", "eggs", "coffee",
      "pad-thai", "massaman", "grilled-fish", "green-curry", "pomelo-salad", "morning-glory",
      "tom-yum", "mango-sticky-rice", "sundowner", "lemongrass-cooler", "iced-tea", "beer",
    ],
    [128, 256]
  ),
];
