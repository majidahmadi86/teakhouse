/**
 * Write static brand-board HTML proofs for each preset (no browser binary required).
 * Open qa-shots/presets/*.html or convert via Edge/Chrome headless if available.
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "qa-shots", "presets");
fs.mkdirSync(OUT, { recursive: true });

const presets = [
  {
    id: "tropical-resort",
    name: "THE TEAK HOUSE",
    tag: "Riverside Boutique Hotel · Bangkok",
    navy: "#0A2E5C",
    blue: "#0A6CDE",
    coral: "#FF6B4A",
    gold: "#E8A93D",
    cloud: "#F4F7FB",
  },
  {
    id: "city-boutique",
    name: "MAISON LANE",
    tag: "Design Hotel · Silom",
    navy: "#2C1810",
    blue: "#8B4513",
    coral: "#C45C26",
    gold: "#C4A35A",
    cloud: "#F7F5F2",
  },
  {
    id: "minimal-zen",
    name: "QUIET HOUSE",
    tag: "Minimal Stay · Chiang Mai",
    navy: "#2A2A28",
    blue: "#4A5D4E",
    coral: "#8B7355",
    gold: "#A89070",
    cloud: "#F2F2EE",
  },
];

for (const p of presets) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>${p.id}</title>
<style>
  body{margin:0;font-family:Georgia,serif;background:${p.cloud};color:${p.navy}}
  .hero{height:70vh;background:linear-gradient(135deg,${p.navy},${p.blue});display:flex;flex-direction:column;justify-content:flex-end;padding:48px;color:#fff}
  .name{font-size:42px;letter-spacing:.06em}
  .tag{margin-top:8px;opacity:.85;font-family:system-ui;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:${p.gold}}
  .swatches{display:flex;gap:12px;padding:24px 48px}
  .sw{width:72px;height:72px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .label{padding:0 48px 32px;font-family:system-ui;font-size:13px;color:#5E6B7E}
</style></head>
<body>
  <div class="hero"><div class="name">${p.name}</div><div class="tag">${p.tag}</div></div>
  <div class="swatches">
    <div class="sw" style="background:${p.navy}"></div>
    <div class="sw" style="background:${p.blue}"></div>
    <div class="sw" style="background:${p.coral}"></div>
    <div class="sw" style="background:${p.gold}"></div>
    <div class="sw" style="background:${p.cloud};border:1px solid #ddd"></div>
  </div>
  <div class="label">Preset proof · ${p.id} · switch via config/hotel.config.ts</div>
</body></html>`;
  fs.writeFileSync(path.join(OUT, `${p.id}.html`), html);
  console.log("Wrote", p.id);
}
