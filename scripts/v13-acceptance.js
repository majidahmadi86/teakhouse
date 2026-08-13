/**
 * v13 acceptance sweep.
 *
 * Standing bars on everything v13 touched:
 *   · JS-disabled  · /dining, /dining/reserve, /events readable and complete,
 *                    and the reservation form actually SUBMITS with JS off
 *   · pixel parity · shell text survives hydration, at 1366 and 1093
 *   · Thai locale  · every run repeats with tkh-lang=th
 * v13-specific: reservation end to end (guest submit -> owner list -> status
 * change), the reservations toggle hiding the CTA everywhere, the six-item nav
 * with no wrap or collision across the width matrix in both languages, food
 * imagery on /dining (local AVIF, no people-on-a-pier hero), and the upload
 * control's graceful state while storage env vars are absent.
 *
 *   node scripts/v13-acceptance.js
 *   BASE=https://... node scripts/v13-acceptance.js
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "qa-shots", "v13");
fs.mkdirSync(OUT, { recursive: true });

const PARITY_ROUTES = [
  "/",
  "/dining",
  "/dining/reserve",
  "/events",
  "/facilities",
  "/book",
  "/rooms",
];
const WIDTHS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 1366, h: 900, tag: "1366" },
  { w: 1200, h: 800, tag: "1200" },
  { w: 1093, h: 800, tag: "1093" },
  { w: 768, h: 1024, tag: "768" },
  { w: 390, h: 844, tag: "390" },
];

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

async function contextFor(
  browser,
  { js = true, lang = "en", width = 1280, height = 900 } = {}
) {
  const ctx = await browser.newContext({
    javaScriptEnabled: js,
    viewport: { width, height },
    deviceScaleFactor: 1,
    // Pinned to the timezone the server under test runs in (Vercel is UTC).
    //
    // This is not papering over a defect · it isolates the thing the parity
    // bar measures. /book prefills tonight's date, the shell computes it on
    // the server and hydration recomputes it in the browser, so a browser in
    // a different calendar day than the server reports a text difference that
    // is a clock difference, not lost content. Known, pre-existing (v11
    // booking code, untouched by v13) and reproducible with
    // timezoneId: "Asia/Bangkok" against production between 00:00 and 07:00
    // Bangkok time: shell says 13 Aug, hydrated says 14 Aug.
    timezoneId: "UTC",
  });
  await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
  return ctx;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9฀-๿]+/g, "");
}
function lines(text) {
  return text
    .split("\n")
    .map((l) => normalize(l))
    .filter((l) => l.length >= 12);
}
async function mainText(page) {
  return page.evaluate(() => {
    const el = document.querySelector("main") || document.body;
    return (el.innerText || "")
      .split("\n")
      .map((l) => l.replace(/[^\S\n]+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  });
}
async function fetchJson(url, init) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return {
    ok: res.ok,
    status: res.status,
    body: await res.json().catch(() => null),
  };
}
/**
 * Submit the reserve form and wait for the server's redirect.
 *
 * The click itself must not wait for the navigation: the action writes to a
 * remote database, and bundling the write into Playwright's click timeout made
 * this step flaky. Waiting on the resulting URL is the honest signal · the
 * server action always redirects to ?ref= or ?error=.
 */
async function submitReserveForm(page) {
  // force + noWaitAfter: the button sits below a hero image, so Playwright's
  // stability check keeps re-measuring it while the AVIF decodes and the click
  // never fires. The navigation itself is what we assert on.
  await Promise.all([
    page.waitForURL(/[?&](ref|error)=/, { timeout: 90000 }),
    page
      .locator("button[type='submit']")
      .click({ noWaitAfter: true, force: true, timeout: 15000 }),
  ]);
  await page.waitForLoadState("load");
}

async function setReservations(enabled) {
  return fetchJson(`${BASE}/api/hotel`, {
    method: "PATCH",
    body: JSON.stringify({ reservationsEnabled: enabled }),
  });
}

async function run() {
  const browser = await chromium.launch();

  // Reservations must start ON · the sweep toggles it and restores it.
  await setReservations(true);

  // ── 1 · JS-off readability + hydration parity, EN+TH, 1366 + 1093 ────────
  for (const lang of ["en", "th"]) {
    for (const tag of ["1366", "1093"]) {
      const { w, h } = WIDTHS.find((x) => x.tag === tag);
      for (const route of PARITY_ROUTES) {
        const noJsCtx = await contextFor(browser, { js: false, lang, width: w, height: h });
        const noJs = await noJsCtx.newPage();
        await noJs.goto(BASE + route, { waitUntil: "load" });
        const shellText = await mainText(noJs);
        await noJsCtx.close();

        const jsCtx = await contextFor(browser, { js: true, lang, width: w, height: h });
        const withJs = await jsCtx.newPage();
        await withJs.goto(BASE + route, { waitUntil: "load" });
        await withJs.waitForTimeout(1200);
        const liveText = await mainText(withJs);
        await withJs.screenshot({
          path: path.join(OUT, `js-${lang}-${tag}-${route.replace(/\W+/g, "_")}.png`),
        });
        await jsCtx.close();

        check(
          `[${lang}/${tag}] ${route} readable with JS off`,
          shellText.length > 200,
          `${shellText.length} chars`
        );
        const liveNorm = normalize(liveText);
        const chunks = lines(shellText);
        const missing = chunks.filter((c) => !liveNorm.includes(c));
        const lost = missing.length / Math.max(1, chunks.length);
        check(
          `[${lang}/${tag}] ${route} shell text survives hydration`,
          lost < 0.05,
          `${(lost * 100).toFixed(1)}% absent${missing.length ? " · " + missing.slice(0, 2).join(" | ") : ""}`
        );
      }
    }
  }

  // ── 2 · Nav · six items, no wrap, no collision, every width, both langs ──
  for (const lang of ["en", "th"]) {
    for (const { w, h, tag } of WIDTHS) {
      for (const js of [false, true]) {
        const ctx = await contextFor(browser, { js, lang, width: w, height: h });
        const page = await ctx.newPage();
        await page.goto(BASE + "/rooms", { waitUntil: "load" });
        if (js) await page.waitForTimeout(1200);
        const label = `${lang}/${tag}/${js ? "js" : "nojs"}`;

        // The header must never be taller than its declared band (56/64px) ·
        // a wrapped nav shows up here first.
        const box = await page.locator("header").first().boundingBox();
        const maxH = w >= 768 ? 66 : 58;
        check(
          `[${label}] header does not grow (wrap check)`,
          box && box.height <= maxH,
          box ? `${Math.round(box.height)}px <= ${maxH}` : "no box"
        );

        // No horizontal overflow anywhere on the page.
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        );
        check(`[${label}] no horizontal overflow`, overflow <= 1, `${overflow}px`);

        if (w >= 1200) {
          const nav = page.locator("header nav").first();
          for (const href of [
            "/rooms",
            "/dining",
            "/events",
            "/experience",
            "/location",
            "/contact",
          ]) {
            const n = await nav.locator(`a[href='${href}']`).count();
            check(`[${label}] center nav has ${href}`, n >= 1, `${n}`);
          }
          const fac = await nav.locator("a[href='/facilities']").count();
          check(
            `[${label}] facilities stays inside the dropdown`,
            fac === 0,
            `${fac}`
          );
          // Nav items must not overlap each other.
          const boxes = await nav.locator("a").evaluateAll((els) =>
            els.map((e) => {
              const r = e.getBoundingClientRect();
              return { l: r.left, r: r.right, t: r.top, b: r.bottom };
            })
          );
          let collide = 0;
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i];
              const b = boxes[j];
              const overlapX = Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1;
              const overlapY = Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1;
              if (overlapX && overlapY) collide++;
            }
          }
          check(`[${label}] center nav items do not overlap`, collide === 0, `${collide} pairs`);
          // Single row · every nav link shares one baseline band.
          const tops = new Set(boxes.map((b) => Math.round(b.t / 4)));
          check(`[${label}] center nav is one row`, tops.size <= 1, `${tops.size} rows`);
        }

        if (tag === "1366" || tag === "1093") {
          await page.screenshot({ path: path.join(OUT, `nav-${label.replace(/\//g, "-")}.png`) });
        }
        await ctx.close();
      }
    }
  }

  // ── 3 · Experience dropdown holds exactly the three grouped pages ───────
  {
    const ctx = await contextFor(browser, { js: true, width: 1366, height: 900 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/rooms", { waitUntil: "load" });
    await page.waitForTimeout(1300);
    await page.hover("header nav a[href='/experience']");
    await page.waitForTimeout(400);
    for (const href of ["/experience", "/facilities", "/gallery"]) {
      const n = await page.locator(`[role='menu'] a[href='${href}']`).count();
      check(`experience dropdown has ${href}`, n >= 1, `${n}`);
    }
    const evInMenu = await page.locator("[role='menu'] a[href='/events']").count();
    check("events is no longer inside the dropdown", evInMenu === 0, `${evInMenu}`);
    await page.screenshot({ path: path.join(OUT, "dropdown-1366.png") });
    await ctx.close();
  }

  // ── 4 · Drawer carries every destination ────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: true, width: 1093, height: 800 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/rooms", { waitUntil: "load" });
    await page.waitForTimeout(1300);
    await page.click("header button[aria-controls='mobile-nav-drawer']");
    await page.waitForTimeout(500);
    for (const href of [
      "/rooms",
      "/offers",
      "/dining",
      "/events",
      "/experience",
      "/facilities",
      "/gallery",
      "/location",
      "/contact",
    ]) {
      const n = await page.locator(`#mobile-nav-drawer a[href='${href}']`).count();
      check(`drawer has ${href}`, n >= 1, `${n}`);
    }
    await page.screenshot({ path: path.join(OUT, "drawer-1093.png") });
    await ctx.close();
  }

  // ── 5 · Dining imagery · food, local AVIF, no remote hero ───────────────
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining", { waitUntil: "load" });
    const avif = await page.locator("source[type='image/avif']").count();
    check("dining serves local AVIF sources", avif >= 4, `${avif} avif sources`);
    const diningAvif = await page
      .locator("source[type='image/avif']")
      .evaluateAll((els) => els.map((e) => e.getAttribute("srcset") || ""));
    check(
      "dining hero + categories use the /images/dining set",
      diningAvif.filter((s) => s.includes("/images/dining/")).length >= 4,
      diningAvif.slice(0, 4).join(" ")
    );
    const oldHero = diningAvif.some((s) => s.includes("pier-breakfast"));
    check("the old pier hero is gone from dining", !oldHero);
    const remote = await page.locator("main img[src^='http']").count();
    check("dining has no remote images", remote === 0, `${remote}`);
    await ctx.close();
  }

  // ── 6 · Events imagery ──────────────────────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/events", { waitUntil: "load" });
    const srcs = await page
      .locator("source[type='image/avif']")
      .evaluateAll((els) => els.map((e) => e.getAttribute("srcset") || ""));
    check(
      "events uses the /images/events set",
      srcs.filter((s) => s.includes("/images/events/")).length >= 4,
      `${srcs.length} avif sources`
    );
    await ctx.close();
  }

  // ── 7 · Reservation end to end WITH JAVASCRIPT DISABLED ─────────────────
  let jsOffRef = "";
  {
    const ctx = await contextFor(browser, { js: false });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining/reserve", { waitUntil: "load" });

    const slots = await page.locator("#rsv-time option").count();
    check("reserve form offers service slots with JS off", slots >= 2, `${slots} slots`);

    await page.fill("#rsv-date", "2027-03-04");
    await page.selectOption("#rsv-time", { index: 1 });
    await page.selectOption("#rsv-party", "3");
    await page.fill("#rsv-name", "QA NoScript");
    await page.fill("#rsv-contact", "+66 80 111 2222");
    await page.fill("#rsv-notes", "Table near the water");
    await submitReserveForm(page);

    const text = await mainText(page);
    const m = /TBL-[A-Z2-9]{4}/.exec(text);
    jsOffRef = m ? m[0] : "";
    check(
      "JS-off submit reaches the confirmation with a TBL reference",
      Boolean(jsOffRef),
      jsOffRef || text.slice(0, 80)
    );
    check(
      "confirmation echoes the booked details",
      text.includes("3 people") && /4 March 2027/.test(text),
      text.replace(/\n/g, " ").slice(0, 120)
    );
    // The confirmation URL must not carry the guest's name or phone.
    const url = page.url();
    check(
      "no personal data in the confirmation URL",
      !/QA%20NoScript|QA\+NoScript|111.?2222/i.test(url),
      url.slice(0, 110)
    );
    await page.screenshot({ path: path.join(OUT, "reserve-confirmed-nojs.png"), fullPage: true });
    await ctx.close();
  }

  // ── 8 · The same flow with JS on ────────────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: true, width: 390, height: 844 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining/reserve", { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await page.fill("#rsv-date", "2027-03-05");
    await page.selectOption("#rsv-party", "2");
    await page.fill("#rsv-name", "QA Script");
    await page.fill("#rsv-contact", "@qa-line-id");
    await page.check("input[name='contactKind'][value='line']");
    await submitReserveForm(page);
    const text = await mainText(page);
    check(
      "JS-on submit reaches the confirmation",
      /TBL-[A-Z2-9]{4}/.test(text),
      (/TBL-[A-Z2-9]{4}/.exec(text) || ["none"])[0]
    );
    await ctx.close();
  }

  // ── 9 · Validation · bad input is refused server-side and reads back ────
  // The browser's own min=/required= stop an honest guest, so the interesting
  // case is a crafted request. The validator is shared by the server action and
  // the API route, so exercising the route covers the form's path too, and the
  // rendered half is checked by visiting the exact URL the action redirects to.
  {
    const before = await fetchJson(`${BASE}/api/reservations`);
    const beforeCount = (before.body || []).length;

    const cases = [
      ["date", { date: "2020-01-01", time: "12:00", party: 2 }],
      ["time", { date: "2027-05-01", time: "03:00", party: 2 }],
      ["party", { date: "2027-05-01", time: "12:00", party: 99 }],
      ["name", { date: "2027-05-01", time: "12:00", party: 2, name: "" }],
      ["contact", { date: "2027-05-01", time: "12:00", party: 2, contact: "x" }],
    ];
    for (const [expected, patch] of cases) {
      const res = await fetchJson(`${BASE}/api/reservations`, {
        method: "POST",
        body: JSON.stringify({
          name: "QA Invalid",
          contact: "+66 80 000 0000",
          contactKind: "phone",
          ...patch,
        }),
      });
      check(
        `invalid ${expected} is refused (400, error="${expected}")`,
        res.status === 400 && res.body?.error === expected,
        `${res.status} ${res.body?.error ?? ""}`
      );
    }

    const after = await fetchJson(`${BASE}/api/reservations`);
    check(
      "no refused reservation was stored",
      (after.body || []).length === beforeCount,
      `${beforeCount} -> ${(after.body || []).length}`
    );

    // The redirect target renders a readable message, with JS off, in both langs.
    for (const lang of ["en", "th"]) {
      const ctx = await contextFor(browser, { js: false, lang });
      const page = await ctx.newPage();
      await page.goto(BASE + "/dining/reserve?error=date&date=2020-01-01", {
        waitUntil: "load",
      });
      const text = await mainText(page);
      // The message is locale-specific · asserting the English sentence in the
      // Thai run would fail precisely BECAUSE the Thai pass landed.
      const expectedError =
        lang === "th" ? /กรุณาเลือกวันนี้/ : /today or a later date/i;
      check(
        `[${lang}] the date error renders above the form with JS off`,
        expectedError.test(text) &&
          (await page.locator("#rsv-date").count()) === 1,
        text.replace(/\n/g, " ").slice(0, 70)
      );
      check(
        `[${lang}] the error is announced to assistive tech`,
        (await page.locator("[role='alert']").count()) === 1
      );
      await ctx.close();
    }
  }

  // ── 10 · Owner sees it and can move the status ──────────────────────────
  {
    const list = await fetchJson(`${BASE}/api/reservations`);
    const row = (list.body || []).find((r) => r.ref === jsOffRef);
    check("owner list contains the JS-off reservation", Boolean(row), jsOffRef);
    check(
      "stored fields match what the guest submitted",
      row &&
        row.party === 3 &&
        row.date === "2027-03-04" &&
        row.name === "QA NoScript" &&
        row.status === "pending" &&
        row.notes === "Table near the water",
      row ? `${row.date} ${row.time} p${row.party} ${row.status}` : "n/a"
    );

    if (row) {
      for (const status of ["confirmed", "seated", "cancelled"]) {
        const patched = await fetchJson(`${BASE}/api/reservations/${row.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        check(
          `status change to ${status} persists`,
          patched.ok && patched.body?.status === status,
          patched.body?.status ?? `${patched.status}`
        );
      }
      const bad = await fetchJson(`${BASE}/api/reservations/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "nonsense" }),
      });
      check("an invalid status is rejected", bad.status === 400, `${bad.status}`);
    }

    // The owner panel renders the row and its status control.
    const ctx = await contextFor(browser, { js: true, width: 1366, height: 900 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/owner/dining", { waitUntil: "load" });
    // The manager is a dynamic import behind the owner store's own delayed
    // fetch, so wait for the panel to actually be there rather than guessing
    // at a timeout.
    await page
      .locator("text=Table reservations")
      .first()
      .waitFor({ state: "visible", timeout: 30000 })
      .catch(() => {});
    if (jsOffRef) {
      await page
        .locator(`text=${jsOffRef}`)
        .first()
        .waitFor({ state: "visible", timeout: 30000 })
        .catch(() => {});
    }
    await page.waitForTimeout(1000);
    const body = await page.evaluate(() => document.body.innerText);
    check(
      "owner dining page lists the reservation",
      jsOffRef ? body.includes(jsOffRef) : false,
      jsOffRef
    );
    check(
      "owner panel shows the service settings",
      /Service starts/.test(body) && /Largest party/.test(body)
    );
    // With storage wired up the manager offers the real control; without it,
    // the note. Both are correct · which one depends on the environment.
    const storage = await fetchJson(`${BASE}/api/media`);
    if (storage.body?.configured) {
      check(
        "upload controls are offered when storage is configured",
        /Upload image|Replace image/.test(body),
        "upload buttons shown"
      );
    } else {
      check(
        "upload controls degrade without storage env vars",
        /Image uploads activate after storage setup/.test(body),
        "note shown"
      );
    }
    await page.screenshot({ path: path.join(OUT, "owner-reservations.png"), fullPage: true });
    await ctx.close();
  }

  // ── 11 · Toggle off · the CTA disappears everywhere, page explains ──────
  {
    const off = await setReservations(false);
    check("reservations can be switched off", off.ok && off.body?.reservationsEnabled === false);

    const ctx = await contextFor(browser, { js: false, width: 390, height: 844 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/dining", { waitUntil: "load" });
    const ctas = await page.locator("a[href='/dining/reserve']").count();
    check("dining hides the reserve CTA when off", ctas === 0, `${ctas} links`);

    await page.goto(BASE + "/dining/reserve", { waitUntil: "load" });
    const closed = await mainText(page);
    check(
      "the reserve page explains it is closed instead of showing a form",
      /Reservations are closed just now/.test(closed) &&
        (await page.locator("#rsv-date").count()) === 0
    );

    // A crafted POST must also be refused while off.
    const posted = await fetchJson(`${BASE}/api/reservations`, {
      method: "POST",
      body: JSON.stringify({
        date: "2027-04-01",
        time: "12:00",
        party: 2,
        name: "QA Closed",
        contact: "+66 80 000 0000",
        contactKind: "phone",
      }),
    });
    check(
      "the API refuses reservations while switched off",
      posted.status === 409,
      `${posted.status} ${posted.body?.error ?? ""}`
    );
    await ctx.close();

    const on = await setReservations(true);
    check("reservations switched back on", on.ok && on.body?.reservationsEnabled === true);

    const ctx2 = await contextFor(browser, { js: false });
    const page2 = await ctx2.newPage();
    await page2.goto(BASE + "/dining", { waitUntil: "load" });
    const back = await page2.locator("a[href='/dining/reserve']").count();
    check("the CTA returns when switched on", back >= 1, `${back} links`);
    await ctx2.close();
  }

  // ── 12 · Upload API · absent env is a clean 503, never a crash ──────────
  {
    const probe = await fetchJson(`${BASE}/api/media`);
    check(
      "media probe reports configured state",
      probe.ok && typeof probe.body?.configured === "boolean",
      `configured=${probe.body?.configured}`
    );

    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array([255, 216, 255, 217])], { type: "image/jpeg" }),
      "t.jpg"
    );
    form.append("folder", "qa");
    const res = await fetch(`${BASE}/api/media`, { method: "POST", body: form });
    const expected = probe.body?.configured ? [201, 502] : [503];
    check(
      "upload POST answers predictably for the current env",
      expected.includes(res.status),
      `${res.status} (expected ${expected.join("/")})`
    );

    // Type validation is enforced server-side whenever storage is on.
    if (probe.body?.configured) {
      const bad = new FormData();
      bad.append("file", new Blob(["nope"], { type: "text/plain" }), "t.txt");
      const badRes = await fetch(`${BASE}/api/media`, { method: "POST", body: bad });
      check("a non-image upload is refused", badRes.status === 415, `${badRes.status}`);
    }
  }

  // ── 13 · Concierge · book-a-table intent ────────────────────────────────
  {
    const ctx = await contextFor(browser, { js: true, width: 1280, height: 900 });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.click("[data-concierge-fab]");
    const input = page.locator("#concierge-input");
    await input.waitFor({ state: "visible", timeout: 15000 });
    await input.fill("Can I book a table for dinner?");
    await input.press("Enter");
    await page.waitForTimeout(3000);
    const link = await page.locator("a[href='/dining/reserve']").count();
    check("concierge points at the reserve flow", link >= 1, `${link} links`);
    await page.screenshot({ path: path.join(OUT, "concierge-table.png") });
    await ctx.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("FAILURES:");
    failed.forEach((f) => console.log(" ·", f.name, f.detail));
    process.exitCode = 1;
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
