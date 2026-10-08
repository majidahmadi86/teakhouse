/**
 * Teak House typography, self-hosted per script · run once, commit the output.
 *
 *   node scripts/fonts/build-fonts.mjs            · every set
 *   node scripts/fonts/build-fonts.mjs latin thai · just these
 *
 * Why not next/font: next/font attaches a font's preloads to the LAYOUT that
 * imports it, and every guest page now shares one root layout per language
 * (app/[lang]/layout.tsx), so a Thai page would preload Marcellus and a Latin
 * page Kanit. Self-hosting lets each language load, and preload, only its own
 * two families (A1: at most 2 families and 3 preloaded files on any route).
 *
 * What it does, per set:
 * - reads Google Fonts' CSS2 API with a modern user agent (woff2, Google's
 *   unicode-range subsets), keeps only the subsets the set needs
 * - downloads every woff2 slice ONCE to public/fonts/<family>/ under a
 *   content-hashed name (served with an immutable one-year cache,
 *   next.config.mjs), four at a time with retries
 * - computes fallback metrics for each family (ascent/descent/line-gap
 *   overrides and size-adjust against Arial or Times New Roman, the same
 *   computation next/font's adjustFontFallback uses), so the swap moves
 *   nothing (CLS 0)
 * - writes lib/fonts.generated.ts: per set, the @font-face CSS (inlined in the
 *   page head; for CJK, whose slice tables are large, a hashed stylesheet in
 *   public/fonts/css/ loaded without blocking the first paint), the family
 *   stacks, and the 2 files to preload
 *
 * Fonts: SIL Open Font License (Google Fonts).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PUB = path.join(ROOT, "public", "fonts");
const fkMod = require(path.join(ROOT, "node_modules/next/dist/compiled/@next/font/dist/fontkit")).default;
const fontFromBuffer = fkMod.default || fkMod;
const { getFallbackMetricsFromFontFile } = require(
  path.join(ROOT, "node_modules/next/dist/compiled/@next/font/dist/local/get-fallback-metrics-from-font-file")
);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/**
 * family: Google family name · as: the name used in CSS (prefixed, so a font
 * installed on the guest's machine never stands in for ours) · category: what
 * the fallback is (serif -> Times New Roman, sans-serif -> Arial).
 */
const F = {
  marcellus: { family: "Marcellus", as: "tkh Marcellus", weights: [400], category: "serif" },
  jakarta: { family: "Plus Jakarta Sans", as: "tkh Jakarta", weights: [400, 700], category: "sans-serif" },
  kanit: { family: "Kanit", as: "tkh Kanit", weights: [500, 600], category: "sans-serif" },
  sarabun: { family: "Sarabun", as: "tkh Sarabun", weights: [400, 600], category: "sans-serif" },
  spectral: { family: "Spectral", as: "tkh Spectral", weights: [400], category: "serif" },
  forum: { family: "Forum", as: "tkh Forum", weights: [400], category: "serif" },
  manrope: { family: "Manrope", as: "tkh Manrope", weights: [400, 700], category: "sans-serif" },
  serifSC: { family: "Noto Serif SC", as: "tkh Serif SC", weights: [400], category: "serif" },
  sansSC: { family: "Noto Sans SC", as: "tkh Sans SC", weights: [400, 700], category: "sans-serif" },
  serifJP: { family: "Noto Serif JP", as: "tkh Serif JP", weights: [400], category: "serif" },
  sansJP: { family: "Noto Sans JP", as: "tkh Sans JP", weights: [400, 700], category: "sans-serif" },
  serifKR: { family: "Noto Serif KR", as: "tkh Serif KR", weights: [400], category: "serif" },
  sansKR: { family: "Noto Sans KR", as: "tkh Sans KR", weights: [400, 700], category: "sans-serif" },
  kufi: { family: "Noto Kufi Arabic", as: "tkh Kufi", weights: [400], category: "sans-serif" },
  sansAR: { family: "Noto Sans Arabic", as: "tkh Sans Arabic", weights: [400, 700], category: "sans-serif" },
  serifHI: { family: "Noto Serif Devanagari", as: "tkh Serif Devanagari", weights: [400], category: "serif" },
  sansHI: { family: "Noto Sans Devanagari", as: "tkh Sans Devanagari", weights: [400, 700], category: "sans-serif" },
};

/**
 * One set per script. display / text: the two families. subsets: Google's
 * subsets to keep (CJK keeps its numbered slices). preload: [font key, weight,
 * subset] for the files a first paint of that language needs.
 */
const SETS = {
  latin: {
    display: "marcellus", text: "jakarta", subsets: ["latin", "latin-ext"],
    preload: [["marcellus", 400, "latin"], ["jakarta", 400, "latin"]],
  },
  vi: {
    display: "spectral", text: "jakarta", subsets: ["latin", "latin-ext", "vietnamese"],
    preload: [["spectral", 400, "vietnamese"], ["jakarta", 400, "vietnamese"]],
  },
  cyrillic: {
    display: "forum", text: "manrope", subsets: ["cyrillic", "cyrillic-ext", "latin", "latin-ext"],
    preload: [["forum", 400, "cyrillic"], ["manrope", 400, "cyrillic"]],
  },
  thai: {
    display: "kanit", text: "sarabun", subsets: ["thai", "latin", "latin-ext"],
    preload: [["kanit", 600, "thai"], ["sarabun", 400, "thai"]],
  },
  arabic: {
    display: "kufi", text: "sansAR", subsets: ["arabic", "latin", "latin-ext"],
    preload: [["kufi", 400, "arabic"], ["sansAR", 400, "arabic"]],
  },
  devanagari: {
    display: "serifHI", text: "sansHI", subsets: ["devanagari", "latin", "latin-ext"],
    preload: [["serifHI", 400, "devanagari"], ["sansHI", 400, "devanagari"]],
  },
  sc: { display: "serifSC", text: "sansSC", subsets: "*", preload: [], external: true },
  jp: { display: "serifJP", text: "sansJP", subsets: "*", preload: [], external: true },
  kr: { display: "serifKR", text: "sansKR", subsets: "*", preload: [], external: true },
};

async function get(url, as = "text", tries = 6) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return as === "text" ? await res.text() : Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((r) => setTimeout(r, 500 * i * i));
    }
  }
}

async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) {
        const i = next++;
        await fn(items[i], i);
      }
    })
  );
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Google's @font-face blocks for a family: [{subset, weight, url, range}]. */
async function faces(key) {
  const f = F[key];
  const q = f.weights.length > 1 || f.weights[0] !== 400 ? `:wght@${f.weights.join(";")}` : "";
  const css = await get(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.family)}${q}&display=swap`);
  const out = [];
  // Named subsets carry a /* latin */ comment; CJK slices have none (their URL
  // ends .<n>.woff2), so they are named slice-<n>.
  const re = /(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const body = m[2];
    const url = /url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
    const weight = Number(/font-weight:\s*(\d+)/.exec(body)?.[1]);
    const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim();
    const label = m[1]
      ? m[1].replace(/[[\]]/g, "")
      : `slice-${/\.(\d+)\.woff2$/.exec(url ?? "")?.[1] ?? out.length}`;
    if (url && weight && range) out.push({ subset: label, weight, url, range });
  }
  if (!out.length) throw new Error(`no faces for ${f.family}`);
  return out;
}

const downloaded = new Map(); // google url -> public path

async function fetchFile(key, face) {
  if (downloaded.has(face.url)) return downloaded.get(face.url);
  const buf = await get(face.url, "buffer");
  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 10);
  const dir = path.join(PUB, slug(F[key].family));
  fs.mkdirSync(dir, { recursive: true });
  // Named by content: a variable font Google serves for several weights is
  // one file, downloaded once by the browser.
  const name = `${slug(face.subset)}.${hash}.woff2`;
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, buf);
  const pub = `/fonts/${slug(F[key].family)}/${name}`;
  downloaded.set(face.url, pub);
  return pub;
}

function fallbackFace(key, metricsFile) {
  const f = F[key];
  let o = null;
  try {
    const font = fontFromBuffer(fs.readFileSync(path.join(ROOT, "public", metricsFile)));
    o = getFallbackMetricsFromFontFile(font, f.category);
  } catch (e) {
    console.warn(`  metrics skipped for ${f.family}: ${e.message}`);
  }
  const local = f.category === "serif" ? "Times New Roman" : "Arial";
  const parts = [`font-family:"${f.as} Fallback"`, `src:local("${local}")`];
  if (o) {
    parts.push(`ascent-override:${o.ascentOverride}`, `descent-override:${o.descentOverride}`, `line-gap-override:${o.lineGapOverride}`, `size-adjust:${o.sizeAdjust}`);
  }
  return `@font-face{${parts.join(";")}}`;
}

const SYSTEM = {
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  "sans-serif": 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
};
const stack = (key) => `"${F[key].as}","${F[key].as} Fallback",${SYSTEM[F[key].category]}`;

async function buildSet(name) {
  const set = SETS[name];
  const blocks = [];
  const preloads = [];
  const fallbacks = [];
  for (const key of [set.display, set.text]) {
    const all = await faces(key);
    const keep = set.subsets === "*" ? all : all.filter((x) => set.subsets.includes(x.subset));
    const files = [];
    await pool(keep, 4, async (face) => {
      const pub = await fetchFile(key, face);
      files.push({ face, pub });
    });
    files.sort((a, b) => a.face.weight - b.face.weight || a.face.subset.localeCompare(b.face.subset, "en", { numeric: true }));
    for (const { face, pub } of files) {
      blocks.push(
        `@font-face{font-family:"${F[key].as}";font-style:normal;font-weight:${face.weight};font-display:swap;src:url(${pub}) format("woff2");unicode-range:${face.range}}`
      );
    }
    // Fallback metrics from the regular weight's Latin slice (a-z is what the
    // size-adjust computation measures); any slice will do for the vertical ones.
    const regular = files.filter((x) => x.face.weight === Math.min(...F[key].weights));
    const latin =
      regular.find((x) => x.face.subset === "latin") ??
      regular.find((x) => /U\+0000-00FF|U\+0020-007E|U\+0061/i.test(x.face.range)) ??
      regular[regular.length - 1];
    fallbacks.push(fallbackFace(key, latin.pub));
    console.log(`  ${F[key].family}: ${files.length} files`);
  }
  for (const [key, weight, subset] of set.preload) {
    const face = (await faces(key)).find((x) => x.weight === weight && x.subset === subset);
    if (!face) throw new Error(`preload ${key} ${weight} ${subset} not found`);
    preloads.push(await fetchFile(key, face));
  }
  const d = stack(set.display);
  const t = stack(set.text);
  // The house's existing variable names (tailwind.config.ts, globals.css) all
  // point at THIS set's pair, so no page can reach a third family.
  const vars = `:root{--font-display:${d};--font-text:${t};--font-marcellus:${d};--font-jakarta:${t};--font-kanit:${d};--font-sarabun:${t}}`;
  const css = [...fallbacks, ...blocks].join("\n");
  let cssHref = null;
  if (set.external) {
    const hash = crypto.createHash("sha256").update(css).digest("hex").slice(0, 10);
    fs.mkdirSync(path.join(PUB, "css"), { recursive: true });
    for (const old of fs.readdirSync(path.join(PUB, "css"))) {
      if (old.startsWith(`${name}.`)) fs.unlinkSync(path.join(PUB, "css", old));
    }
    fs.writeFileSync(path.join(PUB, "css", `${name}.${hash}.css`), css + "\n");
    cssHref = `/fonts/css/${name}.${hash}.css`;
  }
  return {
    families: [F[set.display].family, F[set.text].family],
    vars,
    css: set.external ? fallbacks.join("\n") : css,
    cssHref,
    preloads,
  };
}

const only = process.argv.slice(2);
const OUT = path.join(ROOT, "lib", "fonts.generated.ts");
let previous = {};
if (only.length && fs.existsSync(OUT)) {
  const m = /export const FONT_SETS = (\{[\s\S]*\}) as const;/.exec(fs.readFileSync(OUT, "utf8"));
  if (m) previous = JSON.parse(m[1]);
}
const result = { ...previous };
for (const name of Object.keys(SETS)) {
  if (only.length && !only.includes(name)) continue;
  console.log(`set ${name}`);
  result[name] = await buildSet(name);
}
fs.writeFileSync(
  OUT,
  `/* Generated by scripts/fonts/build-fonts.mjs · do not edit by hand. */
/* Fonts: SIL Open Font License, via Google Fonts, self-hosted under public/fonts. */
export const FONT_SETS = ${JSON.stringify(result, null, 2)} as const;
`
);
console.log(`wrote ${path.relative(ROOT, OUT)}`);
