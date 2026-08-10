/**
 * Screenshot preset HTML proof boards with Playwright.
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

async function main() {
  const { chromium } = require("playwright");
  const dir = path.join(__dirname, "..", "qa-shots", "presets");
  fs.mkdirSync(dir, { recursive: true });
  require("./preset-proof-html.js");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const id of ["tropical-resort", "city-boutique", "minimal-zen"]) {
    const html = path.join(dir, `${id}.html`);
    await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(dir, `${id}.png`),
      fullPage: false,
    });
    console.log("Wrote", id + ".png");
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
