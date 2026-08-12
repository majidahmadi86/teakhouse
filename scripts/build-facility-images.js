/**
 * Fetch the site's photography once and encode it to local AVIF.
 * (v11 facilities + house, extended in v13 with the dining and events sets.)
 *
 * Every new v11 image ships from our own origin as AVIF at two widths, so the
 * facilities page and the home strip cost one small request per card with no
 * third-party CDN on the critical path. Re-run only when the source list below
 * changes · the encoded files are committed.
 *
 * Sources are Unsplash photo ids, each one picked against the caption it is
 * used with (an "airport transfer" card gets a car, not an airliner's livery).
 * Attention-weighted cropping keeps the subject in frame at both widths.
 *
 *   node scripts/build-facility-images.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUT_DIR = path.join(__dirname, "..", "public", "images");
const WIDTHS = [640, 1280];
const QUALITY = 52;

const SOURCES = [
  // Facilities · 4:3 cards
  { slug: "facilities/pool", id: "photo-1782201591423-81523d90ee69", ratio: 4 / 3 },
  { slug: "facilities/pier-breakfast", id: "photo-1759276858203-3de4d14f3546", ratio: 4 / 3 },
  { slug: "facilities/courtyard-garden", id: "photo-1732311951587-505da2b22bf7", ratio: 4 / 3 },
  { slug: "facilities/lobby-lounge", id: "photo-1785900217080-76a2ca73769d", ratio: 4 / 3 },
  { slug: "facilities/airport-transfer", id: "photo-1764090317565-46fe49fe2a31", ratio: 4 / 3 },
  { slug: "facilities/housekeeping", id: "photo-1631015108968-ba3b87f89005", ratio: 4 / 3 },
  { slug: "facilities/luggage-storage", id: "photo-1637043398520-4dec20e83d63", ratio: 4 / 3 },

  // House & team · the house portrait, then one image per role.
  // Role images are deliberately environmental (a desk, a bell, a trolley, hands
  // at work) rather than portraits: the names beside them are demo names, and
  // pinning an invented identity on an identifiable stranger is not something a
  // real hotel site should ship. Swap in real staff photography for production.
  { slug: "house/story", id: "premium_photo-1673283243936-57acf471fc0e", ratio: 4 / 5 },
  { slug: "house/front-desk", id: "premium_photo-1664202526554-e6bf41d6d794", ratio: 1 },
  { slug: "house/concierge-desk", id: "photo-1758708536313-e7055ddba277", ratio: 1 },
  { slug: "house/housekeeping-team", id: "photo-1580842402762-6f5868c17412", ratio: 1 },
  { slug: "house/kitchen", id: "photo-1784955703055-858931d28472", ratio: 1 },

  // v13 · DINING · food photography, not people. The v12 hero was a person on
  // the pier, which told a guest nothing about the kitchen. Every frame here is
  // the food itself, close cropped, warm light. Heroes are 16:9 (full-bleed
  // band), category strips 16:7, so the crop is decided here and not by CSS.
  { slug: "dining/hero", id: "photo-1763647818427-326fa8e6699f", ratio: 16 / 9 },
  { slug: "dining/reserve", id: "photo-1463183547458-6a2c760d0912", ratio: 16 / 9 },
  // Centre gravity, not attention: the salient-region crop of this one walks
  // off the claypot onto the empty table and loses the food entirely.
  {
    slug: "dining/breakfast",
    id: "photo-1766761562530-c8dd12c96d9a",
    ratio: 16 / 7,
    position: "center",
  },
  { slug: "dining/thai-kitchen", id: "photo-1618449840665-9ed506d73a34", ratio: 16 / 7 },
  { slug: "dining/drinks", id: "photo-1750124933194-e021f47b5f8b", ratio: 16 / 7 },

  // v13 · EVENTS · the pavilion after dark: laid tables, candles, string lights.
  { slug: "events/hero", id: "photo-1759866614095-d867221143f7", ratio: 16 / 9 },
  { slug: "events/pavilion-dinner", id: "photo-1740120424442-ccd013ec9581", ratio: 4 / 3 },
  { slug: "events/celebration-table", id: "photo-1511795409834-ef04bbd61622", ratio: 4 / 3 },
  { slug: "events/string-lights", id: "photo-1574482211311-45a2169db57c", ratio: 4 / 3 },

  // v14 · MENU THUMBNAILS · one square crop per seeded dish, shown at 64px
  // beside the name. Square because the frame is square · letting CSS crop a
  // landscape photo to a circle-ish tile put the food half out of frame.
  // Every id below was checked by eye, not by its caption: Unsplash alt text
  // mislabels food often (the som tam here is filed as "vegetable salad").
  { slug: "dishes/rice-soup", id: "photo-1766761562530-c8dd12c96d9a", ratio: 1 },
  { slug: "dishes/crab-omelette", id: "photo-1677137261161-0095c10418ef", ratio: 1 },
  { slug: "dishes/fruit-tray", id: "photo-1641642400143-6be68f1a0918", ratio: 1 },
  { slug: "dishes/coconut-pancakes", id: "photo-1700113120070-b79d456b462c", ratio: 1 },
  { slug: "dishes/eggs", id: "photo-1582169505937-b9992bd01ed9", ratio: 1 },
  { slug: "dishes/coffee", id: "photo-1621267860478-dbdd589372db", ratio: 1 },
  { slug: "dishes/pad-thai", id: "photo-1754586254034-4d2566ea5854", ratio: 1 },
  { slug: "dishes/massaman", id: "photo-1672933036331-e27ffae157bd", ratio: 1 },
  { slug: "dishes/grilled-fish", id: "photo-1551014700-0ca41391f312", ratio: 1 },
  // Genuinely green · the curry used for the category strip reads orange.
  { slug: "dishes/green-curry", id: "photo-1554054204-b2f70b09d031", ratio: 1 },
  { slug: "dishes/pomelo-salad", id: "photo-1652690528406-a547a6eb143f", ratio: 1 },
  { slug: "dishes/morning-glory", id: "photo-1766323106504-6b44debfa313", ratio: 1 },
  { slug: "dishes/tom-yum", id: "photo-1455619452474-d2be8b1e70cd", ratio: 1 },
  { slug: "dishes/mango-sticky-rice", id: "photo-1705056508219-0aa0ceb16820", ratio: 1 },
  { slug: "dishes/sundowner", id: "photo-1750124933194-e021f47b5f8b", ratio: 1 },
  { slug: "dishes/lemongrass-cooler", id: "photo-1621330716555-5cad596c4562", ratio: 1 },
  { slug: "dishes/iced-tea", id: "photo-1556679343-c7306c1976bc", ratio: 1 },
  { slug: "dishes/beer", id: "photo-1608270586620-248524c67de9", ratio: 1 },
];

/** Thumbnails only need small widths · a 64px tile never reads a 1280px file. */
const THUMB_WIDTHS = [128, 256];

async function fetchSource(id) {
  const base = id.startsWith("premium_photo-")
    ? `https://plus.unsplash.com/${id}`
    : `https://images.unsplash.com/${id}`;
  const res = await fetch(`${base}?w=1800&q=85&auto=format&fit=crop`);
  if (!res.ok) throw new Error(`${id} -> HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  let written = 0;

  for (const source of SOURCES) {
    const outPath = path.join(OUT_DIR, source.slug);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    let input;
    try {
      input = await fetchSource(source.id);
    } catch (e) {
      console.error(`FAIL ${source.slug}: ${e.message}`);
      process.exitCode = 1;
      continue;
    }

    const widths = source.slug.startsWith("dishes/") ? THUMB_WIDTHS : WIDTHS;
    for (const width of widths) {
      const height = Math.round(width / source.ratio);
      const resized = sharp(input).resize(width, height, {
        fit: "cover",
        position: source.position ?? "attention",
      });

      const avifFile = `${outPath}-${width}.avif`;
      await resized.clone().avif({ quality: QUALITY, effort: 6 }).toFile(avifFile);

      // WebP twin so the <picture> has something to fall back to · the pages
      // never reference a bare AVIF with no alternative.
      const webpFile = `${outPath}-${width}.webp`;
      await resized.clone().webp({ quality: 72 }).toFile(webpFile);

      const kb = (f) => (fs.statSync(f).size / 1024).toFixed(1);
      console.log(
        `ok  ${path.relative(OUT_DIR, avifFile)}  ${width}x${height}  ${kb(avifFile)} kB avif · ${kb(webpFile)} kB webp`
      );
      written += 2;
    }
  }

  console.log(`\n${written} files written to public/images`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
