/**
 * package-hotelier.mjs · build the sellable Hotelier v1 zip.
 *
 * Produces dist/hotelier-v<version>.zip containing a clean copy of the project:
 *   - excludes VCS, deps, build output, env/secrets, .vercel, this script,
 *     and all Mike-only assets (Mockup, _v1_ref, qa-shots, docs, LH/PSI
 *     artifacts, the whole dev-tooling scripts/ dir)
 *   - includes app/components/lib, all 3 preset configs, prisma schema + seed,
 *     the /prompts kit, public assets, README.md, LICENSE.txt, .env.example
 *   - scrubs studio branding (Mikaro Studio / mikaro.studio) out of code and
 *     config; the demo credit survives only in README.md + LICENSE.txt
 *
 * Windows PowerShell is used for zipping (System.IO.Compression). Run with:
 *   node scripts/package-hotelier.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const VERSION = "1.0.0";
const PRODUCT = "hotelier";
const OUT_DIR = path.join(ROOT, "dist");
const STAGE_NAME = `${PRODUCT}-v${VERSION}`;
const STAGE = path.join(OUT_DIR, STAGE_NAME);
const ZIP = path.join(OUT_DIR, `${STAGE_NAME}.zip`);

/* ---- exclusion rules -------------------------------------------------- */

// Directory names excluded anywhere in the tree.
const EXCLUDE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "out",
  "build",
  "dist",
  ".vercel",
  ".claude",
  ".lh-chrome",
  ".lh-tmp",
  "coverage",
  // Mike-only assets
  "Mockup",
  "_v1_ref",
  "qa-shots",
  "docs",
  // entire dev-tooling dir (LH/PSI/screenshot/regression + this packager)
  "scripts",
]);

// Exact top-level filenames to drop.
const EXCLUDE_FILES = new Set([
  ".env",
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  ".env.test.local",
  "tsconfig.tsbuildinfo",
  "next-env.d.ts",
  ".bundle-after.txt",
  ".DS_Store",
]);

// Filename glob-ish tests.
function isExcludedFile(name) {
  if (EXCLUDE_FILES.has(name)) return true;
  if (name === ".env.example") return false; // keep the documented template
  if (/^\.env($|\.)/.test(name) && name !== ".env.example") return true;
  if (/^\.lh-/.test(name)) return true;
  if (/^\.psi-/.test(name)) return true;
  if (/\.tsbuildinfo$/.test(name)) return true;
  if (/\.(db|db-journal)$/.test(name)) return true;
  if (/\.pem$/.test(name)) return true;
  return false;
}

/* ---- copy ------------------------------------------------------------- */

let copied = 0;
function copyTree(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      copyTree(src, dst);
    } else if (entry.isFile()) {
      if (isExcludedFile(entry.name)) continue;
      fs.copyFileSync(src, dst);
      copied++;
    }
  }
}

/* ---- scrub ------------------------------------------------------------ */

// Text files get studio branding neutralised. README.md + LICENSE.txt are
// exempt · the demo credit + support/licensor lines are allowed to live there.
const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".mdx",
  ".css", ".scss", ".prisma", ".txt", ".html", ".yml", ".yaml", ".example",
]);
const SCRUB_EXEMPT = new Set(["README.md", "LICENSE.txt"]);
const SCRUBS = [
  [/https?:\/\/teakhouse\.mikaro\.studio/gi, "https://demo.example.com"],
  [/mikaro\.studio/gi, "example.com"],
  [/miomika/gi, "example"],
  [/Mikaro Studio/g, "Your Studio"],
];

let scrubbed = 0;
function scrubTree(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scrubTree(p);
      continue;
    }
    const rel = path.relative(STAGE, p);
    if (SCRUB_EXEMPT.has(rel)) continue;
    const ext =
      entry.name === ".env.example" ? ".example" : path.extname(entry.name);
    if (!TEXT_EXT.has(ext)) continue;
    let text = fs.readFileSync(p, "utf8");
    let changed = false;
    for (const [re, to] of SCRUBS) {
      if (re.test(text)) {
        text = text.replace(re, to);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(p, text);
      scrubbed++;
    }
  }
}

/* ---- package.json rewrite --------------------------------------------- */

function rewritePackageJson() {
  const pkgPath = path.join(STAGE, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = PRODUCT;
  pkg.version = VERSION;
  if (pkg.scripts) {
    // presets:shots pointed at the excluded dev-tooling scripts/ dir.
    delete pkg.scripts["presets:shots"];
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

/* ---- verify (post-scrub) ---------------------------------------------- */

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function verifyClean() {
  const files = walk(STAGE);
  const leaks = [];
  const secretFiles = [];
  for (const f of files) {
    const rel = path.relative(STAGE, f);
    const base = path.basename(f);
    if (/^\.env($|\.)/.test(base) && base !== ".env.example") {
      secretFiles.push(rel);
    }
    if (SCRUB_EXEMPT.has(rel)) continue;
    const ext =
      base === ".env.example" ? ".example" : path.extname(base);
    if (!TEXT_EXT.has(ext)) continue;
    const text = fs.readFileSync(f, "utf8");
    if (/mikaro|miomika/i.test(text)) {
      leaks.push(rel);
    }
  }
  return { leaks, secretFiles };
}

/* ---- zip (Windows PowerShell / System.IO.Compression) ----------------- */

function zipStage() {
  if (fs.existsSync(ZIP)) fs.rmSync(ZIP);
  const ps = [
    "Add-Type -AssemblyName System.IO.Compression.FileSystem;",
    `[System.IO.Compression.ZipFile]::CreateFromDirectory('${STAGE}','${ZIP}','Optimal',$true)`,
  ].join(" ");
  execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], {
    stdio: "inherit",
  });
}

/* ---- run -------------------------------------------------------------- */

console.log(`Packaging ${PRODUCT} v${VERSION} ...`);
if (fs.existsSync(STAGE)) fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

copyTree(ROOT, STAGE);
console.log(`  copied ${copied} files into ${path.relative(ROOT, STAGE)}`);

scrubTree(STAGE);
console.log(`  scrubbed studio branding in ${scrubbed} files`);

rewritePackageJson();
console.log("  rewrote package.json (name/version, dropped presets:shots)");

const { leaks, secretFiles } = verifyClean();
if (secretFiles.length) {
  console.error("  SECRET FILE LEAK:", secretFiles.join(", "));
  process.exit(1);
}
if (leaks.length) {
  console.error("  BRANDING LEAK (mikaro/miomika still present):");
  leaks.forEach((l) => console.error("    -", l));
  process.exit(1);
}
console.log("  verify: 0 secret env files, 0 mikaro/miomika refs in code/config");

zipStage();
const bytes = fs.statSync(ZIP).size;
console.log(`\nDONE · ${path.relative(ROOT, ZIP)} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
console.log(ZIP);
