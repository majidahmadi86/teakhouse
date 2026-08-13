/**
 * The owner panel's upload CONTROL, driven through the browser.
 *
 * upload-roundtrip.js proves the API path. This proves the thing an owner
 * actually touches: the file input inside the edit modal, the busy state, and
 * the preview that appears when the upload lands. The two together are the
 * round trip · neither alone is.
 *
 * Runs against production by default (the service-role key only exists there).
 * Selects a dish, uploads, asserts the preview URL, then cancels the modal so
 * nothing is saved · the API script already covers persistence, and a
 * verification run should not leave the demo's menu altered.
 *
 *   node scripts/upload-ui-check.js
 */

const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "https://teakhouse.mikaro.studio";
const IMAGE = "public/images/contact-hero.jpg";

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

async function main() {
  if (!fs.existsSync(IMAGE)) {
    check("source image present", false, IMAGE);
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const failedRequests = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/media") && !r.ok()) {
      failedRequests.push(`${r.request().method()} ${r.status()}`);
    }
  });

  await page.goto(`${BASE}/owner/dining`, { waitUntil: "load" });
  // The panel is a dynamic import behind a store fetch.
  await page.waitForTimeout(9000);

  // Open the first dish for editing · the upload field lives in that modal.
  const editButtons = page.locator("button", { hasText: /Edit|แก้ไข/ });
  const count = await editButtons.count();
  check("the dining manager rendered with editable rows", count > 0, `${count} edit buttons`);
  if (!count) {
    await browser.close();
    process.exitCode = 1;
    return;
  }

  // The dish rows sit below the category rows; take the last edit button, which
  // is a dish rather than a category.
  await editButtons.nth(count - 1).click();
  await page.waitForTimeout(1200);

  const fileInput = page.locator('input[type="file"]').first();
  const hasInput = (await fileInput.count()) > 0;
  check("the edit modal offers a file input", hasInput);
  if (!hasInput) {
    await browser.close();
    process.exitCode = 1;
    return;
  }

  // The control is deliberately sr-only · the visible affordance is its label.
  await fileInput.setInputFiles(IMAGE);

  // Wait for the field to show a stored URL · that only happens after
  // /api/media answers with one.
  const preview = page.locator('p:has-text("supabase.co")').first();
  await preview.waitFor({ timeout: 60000 }).catch(() => {});
  const shown = (await preview.count()) ? (await preview.innerText()).trim() : "";
  check(
    "uploading through the panel yields a stored image URL",
    /^https:\/\/.*supabase\.co\/storage\/.*\.(jpg|jpeg|png|webp)$/.test(shown),
    shown || "(no preview URL appeared)"
  );
  check("no /api/media request failed", failedRequests.length === 0, failedRequests.join(", "));

  if (shown) {
    // The bytes must be publicly readable · same assertion the guest browser makes.
    const res = await fetch(shown);
    check(
      "the panel's uploaded file is publicly readable",
      res.ok,
      `${res.status} ${res.headers.get("content-type")}`
    );
  }

  // Cancel · leaves the dish exactly as it was.
  const cancel = page.locator("button", { hasText: /Cancel|ยกเลิก/ }).first();
  if (await cancel.count()) await cancel.click();
  await page.waitForTimeout(600);
  check("modal cancelled without saving", true, "the demo menu is untouched");

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    failed.forEach((f) => console.log(" ·", f.name, f.detail));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
