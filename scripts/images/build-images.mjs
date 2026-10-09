/**
 * The image registry builder · run once per imagery change, commit the output.
 *
 *   node scripts/images/build-images.mjs            (incremental)
 *   node scripts/images/build-images.mjs --force    (re-encode everything)
 *
 * Reads scripts/images/images.config.mjs (one entry per image: an id, and
 * either the pre-encoded variants that already exist, or a master file plus
 * the widths to encode from it) and writes:
 *
 * - public/img/<id>/<width>.<hash>.avif|webp · content-hashed names, served
 *   with an immutable one-year cache (next.config.mjs). A changed image gets a
 *   new name, so no stale copy can ever be served
 * - every image in AVIF first with a WebP fallback (a WebP is encoded from
 *   the largest variant where only AVIF existed)
 * - lib/images.generated.ts · per image: intrinsic width and height, the
 *   ground colour (the slot shows it until the image is decoded), the focal
 *   point when the config gives one, and the variants by width; plus
 *   OG_IMAGE, the 1200x630 share card
 *
 * Master entries
 *
 *   { id, master: "hero-home.jpg", widths: [...],
 *     crop?: { aspect: "4:5", focal: [x, y] },  // crop before resizing
 *     tone?: "#9c9a98",                          // the ground, instead of the mean colour
 *     focal?: [x, y],                            // emitted for object-position
 *                                                // (re-expressed inside the crop)
 *     quality?: { avif, webp } }
 *
 * read their master from tools/image-masters/ (gitignored: the masters are
 * never committed, only what is encoded from them). EXIF orientation is
 * applied, metadata is stripped, nothing is ever upscaled (a width above the
 * master's, or the crop's, is skipped).
 *
 * Incremental: a master entry whose master bytes and options hash to the same
 * key as in the previous lib/images.generated.ts (IMAGE_BUILD_KEYS), and whose
 * files are all still on disk, is not re-encoded. Files under public/img that
 * no entry references any more are removed at the end.
 *
 * No blur placeholders are generated, by design (A2).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(ROOT, "public", "img");
const MASTERS = path.join(ROOT, "tools", "image-masters");
const GENERATED = path.join(ROOT, "lib", "images.generated.ts");
const { IMAGES, OG } = await import(pathToFileURL(path.join(ROOT, "scripts", "images", "images.config.mjs")).href);
const FORCE = process.argv.includes("--force");

/** Bump when the encoding itself changes, so every master entry re-encodes. */
const ENCODER = "v2";
const AVIF_Q = 50;
const WEBP_Q = 72;
const CONCURRENCY = 3;

const hash = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 10);
const hex = (n) => n.toString(16).padStart(2, "0");

async function dominant(buf) {
  // The mean colour of a small render · a calm ground, not a blur.
  const { data } = await sharp(buf).resize(16, 16, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < data.length; i += 3) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const n = data.length / 3;
  return `#${hex(Math.round(r / n))}${hex(Math.round(g / n))}${hex(Math.round(b / n))}`;
}

const referenced = new Set();

function write(id, width, ext, buf) {
  const dir = path.join(OUT, id);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${width}.${hash(buf)}.${ext}`;
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, buf);
  const url = `/img/${id}/${name}`;
  referenced.add(url);
  return url;
}

/** The previous generated file's exports, parsed back (each is JSON + " as const;"). */
function previous() {
  const out = {};
  if (!fs.existsSync(GENERATED)) return out;
  const src = fs.readFileSync(GENERATED, "utf8");
  for (const m of src.matchAll(/export const (\w+) = ([\s\S]*?) as const;/g)) {
    try {
      out[m[1]] = JSON.parse(m[2]);
    } catch {
      /* an unreadable export only costs a re-encode */
    }
  }
  return out;
}

const parseAspect = (a) => {
  const [w, h] = String(a).split(":").map(Number);
  if (!(w > 0 && h > 0)) throw new Error(`bad aspect ${a}`);
  return w / h;
};

/**
 * The extract box for `aspect` inside a W x H image, placed so the focal
 * point is as central as the frame allows.
 */
function cropBox(W, H, aspect, focal = [0.5, 0.5]) {
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  let width = W;
  let height = H;
  if (W / H > aspect) width = Math.round(H * aspect);
  else height = Math.round(W / aspect);
  const left = Math.round(clamp(focal[0] * W - width / 2, 0, W - width));
  const top = Math.round(clamp(focal[1] * H - height / 2, 0, H - height));
  return { left, top, width, height };
}

/** The master's displayed size (EXIF orientations 5 to 8 swap the axes). */
async function orientedSize(buf) {
  const meta = await sharp(buf).metadata();
  const swap = meta.orientation && meta.orientation >= 5;
  return swap ? { width: meta.height, height: meta.width } : { width: meta.width, height: meta.height };
}

/** A pipeline over the oriented (and cropped) master; metadata is stripped by default. */
function base(buf, box) {
  const p = sharp(buf, { limitInputPixels: false }).rotate();
  return box ? p.extract(box) : p;
}

const prev = previous();
const prevData = prev.IMAGE_DATA ?? {};
const prevKeys = prev.IMAGE_BUILD_KEYS ?? {};
const result = {};
const keys = {};
let reused = 0;
let encoded = 0;

const masterCache = new Map();
function readMaster(file) {
  if (!masterCache.has(file)) {
    const p = path.join(MASTERS, file);
    if (!fs.existsSync(p)) throw new Error(`master missing: tools/image-masters/${file}`);
    masterCache.set(file, fs.readFileSync(p));
  }
  return masterCache.get(file);
}

const exists = (url) => fs.existsSync(path.join(ROOT, "public", url));

const built = {};

async function build(entry) {
  const avif = [];
  const webp = [];
  let largest = null;
  let color = null;
  let focal = entry.focal ?? null;
  if (entry.variants) {
    // Pre-encoded files that already exist: copied byte for byte under hashed names.
    for (const v of entry.variants) {
      const buf = fs.readFileSync(path.join(ROOT, "public", v.file));
      const meta = await sharp(buf).metadata();
      const ext = v.file.split(".").pop();
      const url = write(entry.id, meta.width, ext, buf);
      (ext === "avif" ? avif : webp).push([meta.width, url]);
      if (!largest || meta.width > largest.width) largest = { width: meta.width, height: meta.height, buf };
    }
  } else if (entry.master) {
    const buf = readMaster(entry.master);
    const options = { widths: entry.widths, crop: entry.crop ?? null, quality: entry.quality ?? null, tone: entry.tone ?? null, focal: entry.focal ?? null };
    const key = hash(Buffer.concat([buf, Buffer.from(JSON.stringify({ ENCODER, AVIF_Q, WEBP_Q, options }))]));
    keys[entry.id] = key;
    const old = prevData[entry.id];
    if (!FORCE && old && prevKeys[entry.id] === key && [...old.avif, ...old.webp].every(([, url]) => exists(url))) {
      for (const [, url] of [...old.avif, ...old.webp]) referenced.add(url);
      built[entry.id] = old;
      reused += 1;
      console.log(`${entry.id}: unchanged`);
      return;
    }
    const size = await orientedSize(buf);
    const box = entry.crop ? cropBox(size.width, size.height, parseAspect(entry.crop.aspect), entry.crop.focal) : null;
    const W = box ? box.width : size.width;
    const H = box ? box.height : size.height;
    if (box && focal) {
      // The focal point in the crop's own coordinates (what object-position needs).
      const r = (v) => Math.round(Math.min(Math.max(v, 0), 1) * 1000) / 1000;
      focal = [r((focal[0] * size.width - box.left) / box.width), r((focal[1] * size.height - box.top) / box.height)];
    }
    const qa = entry.quality?.avif ?? AVIF_Q;
    const qw = entry.quality?.webp ?? WEBP_Q;
    let top = 0;
    for (const w of entry.widths) {
      if (w > W) continue; // never upscale
      const pipe = base(buf, box).resize({ width: w, withoutEnlargement: true });
      avif.push([w, write(entry.id, w, "avif", await pipe.clone().avif({ quality: qa, effort: 4, chromaSubsampling: "4:2:0" }).toBuffer())]);
      webp.push([w, write(entry.id, w, "webp", await pipe.clone().webp({ quality: qw, effort: 5 }).toBuffer())]);
      top = Math.max(top, w);
    }
    if (!top) throw new Error(`${entry.id}: every width is above the master's ${W}`);
    largest = { width: top, height: Math.round((top * H) / W), buf: null };
    color = entry.tone ?? (await dominant(await base(buf, box).resize(64).png().toBuffer()));
    encoded += 1;
  }
  if (!largest) throw new Error(`no source for ${entry.id}`);
  if (!webp.length) {
    // AVIF first, WebP fallback: encode the fallback from the largest variant.
    const big = Math.max(...avif.map(([w]) => w));
    const src = avif.find(([w]) => w === big);
    const buf = fs.readFileSync(path.join(ROOT, "public", src[1]));
    for (const [w] of avif) {
      const out = await sharp(buf).resize({ width: w }).webp({ quality: 72 }).toBuffer();
      webp.push([w, write(entry.id, w, "webp", out)]);
    }
  }
  avif.sort((a, b) => a[0] - b[0]);
  webp.sort((a, b) => a[0] - b[0]);
  built[entry.id] = {
    width: largest.width,
    height: largest.height,
    color: color ?? entry.tone ?? (await dominant(largest.buf)),
    ...(focal ? { focal } : {}),
    avif,
    webp,
  };
  console.log(`${entry.id}: ${avif.length} avif + ${webp.length} webp, ${largest.width}x${largest.height}, ground ${built[entry.id].color}`);
}

// A small pool: AVIF encoding is the slow part and each encode is only partly parallel.
const queue = [...IMAGES];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await build(queue.shift());
  })
);
for (const entry of IMAGES) result[entry.id] = built[entry.id];

// The share card: one 1200x630 JPEG cropped around the focal point.
let og = null;
if (OG) {
  const buf = readMaster(OG.master);
  const size = await orientedSize(buf);
  const box = cropBox(size.width, size.height, OG.width / OG.height, OG.focal);
  const out = await base(buf, box)
    .resize({ width: OG.width, height: OG.height, fit: "cover", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toBuffer();
  og = { url: write("og-default", OG.width, "jpg", out), width: OG.width, height: OG.height };
  console.log(`og-default: ${og.url} (${out.length} bytes)`);
}

// Remove what no entry references any more (old hashes, dropped ids).
let pruned = 0;
function prune(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) {
      prune(file);
      if (!fs.readdirSync(file).length) fs.rmdirSync(file);
    } else {
      const url = "/" + path.relative(path.join(ROOT, "public"), file).split(path.sep).join("/");
      if (!referenced.has(url)) {
        fs.rmSync(file);
        pruned += 1;
      }
    }
  }
}
prune(OUT);

fs.writeFileSync(
  GENERATED,
  `/* Generated by scripts/images/build-images.mjs · do not edit by hand. */
export const IMAGE_DATA = ${JSON.stringify(result, null, 2)} as const;
${og ? `\nexport const OG_IMAGE = ${JSON.stringify(og)} as const;\n` : ""}
/* The builder's incremental keys (master bytes + options) · not used at runtime. */
export const IMAGE_BUILD_KEYS = ${JSON.stringify(keys, null, 2)} as const;
`
);
console.log(
  `wrote lib/images.generated.ts (${Object.keys(result).length} images; ${encoded} encoded, ${reused} unchanged, ${pruned} stale files removed)`
);
