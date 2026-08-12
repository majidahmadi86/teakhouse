/**
 * Fetch the v11 facility / house imagery once and encode it to local AVIF.
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
];

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

    for (const width of WIDTHS) {
      const height = Math.round(width / source.ratio);
      const resized = sharp(input).resize(width, height, {
        fit: "cover",
        position: "attention",
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
