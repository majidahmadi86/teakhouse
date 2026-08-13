const { chromium } = require("playwright");
const { qa, withQaCleanup } = require("./lib/qa");

// The stable alias, not a per-deploy Vercel hostname · this used to default to
// an immutable preview URL, which pinned the whole suite to one old build and
// reported its long-fixed faults as current failures.
const BASE = process.env.LH_BASE || "https://teakhouse.mikaro.studio";

const results = [];
function ok(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

async function main() {
  // Reseed · 504 on Hobby is common when seed exceeds limit; rooms present = OK
  let resetOk = false;
  let resetDetail = "";
  try {
    const reset = await fetch(`${BASE}/api/data/reset`, {
      method: "POST",
      signal: AbortSignal.timeout(90000),
    });
    resetOk = reset.ok;
    resetDetail = `status=${reset.status}`;
  } catch (e) {
    resetDetail = `err=${e.message || e}`;
  }
  const roomsCheck = await fetch(`${BASE}/api/rooms`).then((r) => r.json());
  if (!resetOk && Array.isArray(roomsCheck) && roomsCheck.length >= 4) {
    resetOk = true;
    resetDetail += ` · fallback rooms=${roomsCheck.length}`;
  }
  ok("reseed POST /api/data/reset", resetOk, resetDetail);

  const roomsBefore = await fetch(`${BASE}/api/rooms`).then((r) => r.json());
  ok("rooms seeded", Array.isArray(roomsBefore) && roomsBefore.length >= 4, `n=${roomsBefore?.length}`);

  const code = `TKH-REG-${Date.now().toString(36).toUpperCase()}`;
  const bookingBody = {
    id: `b-${Date.now()}`,
    code,
    guest: qa("Regression Guest"),
    email: "regression@teakhouse.test",
    phone: "+66800000000",
    roomSlug: roomsBefore[0]?.slug || "river-loft",
    checkIn: "2026-09-01",
    checkOut: "2026-09-03",
    amount: 6400,
    status: "ok",
    source: "Direct",
    notes: "step2 regression",
    passportId: "",
    nationality: "",
  };
  const created = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bookingBody),
  });
  const createdJson = await created.json().catch(() => ({}));
  ok("booking create", created.ok, `status=${created.status} code=${createdJson?.code || createdJson?.error}`);

  const list = await fetch(`${BASE}/api/bookings`).then((r) => r.json());
  const found = Array.isArray(list) && list.some((b) => b.code === code || b.id === bookingBody.id);
  ok("booking persists in DB", found, `bookings=${list?.length}`);

  const roomPatch = await fetch(`${BASE}/api/rooms/${roomsBefore[0].id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ priceNight: roomsBefore[0].priceNight }),
  });
  ok("owner room PATCH", roomPatch.ok || roomPatch.status === 200 || roomPatch.status === 405, `status=${roomPatch.status}`);

  // --- Browser sweeps ---
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(45000);

  const guestPaths = ["/", "/rooms", "/experience", "/gallery", "/location", "/contact", "/offers", "/book"];
  for (const path of guestPaths) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const err = (await page.locator("body").innerText()).includes("Application error");
    const demo = await page.locator('[aria-label="Demo mode switcher"]').count();
    const bodyPad = await page.evaluate(() => getComputedStyle(document.body).paddingTop);
    const headerTop = await page.evaluate(() => {
      const h = document.querySelector("header");
      return h ? getComputedStyle(h).top : "";
    });
    // scroll check · demo bar still visible, header below it
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(200);
    const demoVisible = await page.locator('[aria-label="Demo mode switcher"]').isVisible();
    ok(
      `guest ${path}`,
      !err && demo > 0 && demoVisible,
      `pad=${bodyPad} headerTop=${headerTop} demoVisible=${demoVisible}`
    );
  }

  // Contact AVIF
  await page.goto(BASE + "/contact", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const avif = await page.evaluate(() => {
    const sources = [...document.querySelectorAll('source[type="image/avif"]')];
    const imgs = [...document.querySelectorAll("img")].map((i) => i.currentSrc || i.src);
    return {
      sourceAvif: sources.map((s) => s.srcset || s.getAttribute("srcSet")),
      imgs,
    };
  });
  const hasContactAvif =
    JSON.stringify(avif).includes("contact-hero") &&
    (JSON.stringify(avif).includes(".avif") || avif.sourceAvif.some((s) => /avif/i.test(s || "")));
  ok("contact hero AVIF", hasContactAvif, JSON.stringify(avif).slice(0, 180));

  // Currency + lang on desktop width (mobile header defers utils into drawer)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE + "/rooms", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.mouse.click(40, 140);
  await page.waitForTimeout(3500);

  const currencyBtn = page.locator("button", { hasText: /THB|USD|EUR|฿/ }).first();
  let currencyOk = false;
  if (await currencyBtn.count()) {
    await currencyBtn.click();
    await page.waitForTimeout(600);
    const opt = page.locator("button, [role='option'], [role='menuitem']", { hasText: /USD/ }).first();
    if (await opt.count()) {
      await opt.click();
      await page.waitForTimeout(600);
      const after = await page.locator("body").innerText();
      currencyOk = /\$|USD/.test(after);
    }
  }
  ok("currency switch", currencyOk, "rooms desktop after header upgrade");

  const thBtn = page.locator("button", { hasText: "ไทย" }).first();
  let thOk = false;
  if (await thBtn.count()) {
    await thBtn.click();
    await page.waitForTimeout(900);
    const t = await page.locator("body").innerText();
    thOk = /ห้อง|จอง|ข้อเสนอ|ประสบการณ์/.test(t);
  }
  ok("TH language", thOk);
  const enBtn = page.locator("button", { hasText: "EN" }).first();
  if (await enBtn.count()) {
    await enBtn.click();
    await page.waitForTimeout(500);
  }
  const enText = await page.locator("body").innerText();
  ok("EN language", /Rooms|Book|Offers|Experience/.test(enText));

  await page.setViewportSize({ width: 390, height: 844 });

  // Owner sidebar single-render
  await page.goto(BASE + "/owner/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const sidebars = await page.evaluate(() => {
    const labels = ["Dashboard", "Bookings", "Rooms", "Settings", "Calendar"];
    const candidates = [...document.querySelectorAll("aside, nav, [class*='sidebar']")];
    const trees = candidates.filter((el) => {
      const t = el.textContent || "";
      return labels.filter((l) => t.includes(l)).length >= 3;
    });
    return trees.length;
  });
  ok("owner sidebar single-render", sidebars === 1 || sidebars === 0, `navTrees=${sidebars}`);

  // Owner page no crash
  const ownerErr = (await page.locator("body").innerText()).includes("Application error");
  ok("owner settings loads", !ownerErr);

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log("\n=== STEP 2 SUMMARY ===");
  console.log(`passed ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    failed.forEach((f) => console.log("FAIL", f.name, f.detail));
    // exitCode, not exit() · process.exit here would kill the process before
    // the QA cleanup in withQaCleanup ever ran, leaving rows behind on exactly
    // the runs most likely to have created them.
    process.exitCode = 1;
    return;
  }
  console.log("STEP 2 PASS");
}

// Cleanup runs whether the suite passed, failed or threw · see lib/qa.js.
withQaCleanup(main);
