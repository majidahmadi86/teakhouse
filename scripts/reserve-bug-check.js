/**
 * /dining/reserve · the closed-state bug, and the flow around it.
 *
 * THE BUG: the guest page served "Reservations are closed just now" while the
 * owner switch said Taking bookings and the service window was open. It was not
 * a clock problem · the closed screen has no time comparison in it at all. It
 * was a POISONED CACHE. getHotelSettings() returned its "reservations OFF"
 * fallback from INSIDE unstable_cache, so any moment the hotel row was
 * unreadable (every reseed deletes and recreates it; a cold connection throws)
 * wrote "closed" into the data cache for an hour, while the owner panel kept
 * reading the live row and disagreeing.
 *
 * What this checks:
 *   1 the page is open when the database says reservations are on
 *   2 it STAYS open across repeated requests · a poisoned entry shows up as one
 *     closed response among several, which is exactly how the bug presented
 *   3 the owner switch and the service hours propagate to the guest page
 *   4 the hotel's day, not the server's UTC day, bounds the date field
 *   5 a guest completes a reservation in EN and TH, with JS on and off, on a
 *     late-evening slot and on tomorrow
 *   6 the SERVER's own rules refuse a past date, an out-of-window time, an
 *     oversized party, and anything at all while the switch is off
 *
 * A note on "several times of day". Whether a reservation is legal depends on
 * the date, the slot and the switch · never on the current wall clock. The one
 * thing the clock changes is which day the SERVER thinks it is, and on Vercel
 * that is UTC, seven hours behind the hotel. So the late-evening case is a
 * SLOT (21:30) and the after-midnight case is the past-date rule, which is
 * exactly what those seven hours used to break. Faking Date inside the page was
 * tried and abandoned: it breaks React before it can tell you anything.
 *
 *   node scripts/reserve-bug-check.js
 *   BASE=https://teakhouse.mikaro.studio node scripts/reserve-bug-check.js
 */

const { chromium } = require("playwright");
const { qa, purgeQaData } = require("./lib/qa");

const BASE = process.env.BASE || "http://localhost:3000";

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

const CLOSED_EN = "Reservations are closed";
const CLOSED_TH = "ปิดรับจอง";

function isClosed(html) {
  return html.includes(CLOSED_EN) || html.includes(CLOSED_TH);
}

async function getHtml(path, lang) {
  const res = await fetch(BASE + path, {
    headers: lang ? { cookie: `tkh-lang=${lang}` } : {},
  });
  return res.text();
}

async function setSettings(patch) {
  const res = await fetch(`${BASE}/api/hotel`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.ok;
}

async function main() {
  const before = await (await fetch(`${BASE}/api/hotel`)).json();

  // ── 1 · open when the database says open ─────────────────────────────────
  await setSettings({ reservationsEnabled: true });
  const open = await getHtml("/dining/reserve");
  check(
    "the page is open when the database says reservations are on",
    !isClosed(open) && open.includes("rsv-date"),
    isClosed(open) ? "served the closed screen" : "form present"
  );

  // ── 2 · it stays open · the poisoned-entry symptom ───────────────────────
  let closedHits = 0;
  for (let i = 0; i < 8; i++) {
    if (isClosed(await getHtml("/dining/reserve"))) closedHits += 1;
  }
  check(
    "eight consecutive requests all serve the form",
    closedHits === 0,
    `${closedHits}/8 served the closed screen`
  );

  // Both languages · the closed screen has its own Thai copy, so a Thai guest
  // would have seen a Thai "closed" notice rather than the form.
  for (const lang of ["en", "th"]) {
    const html = await getHtml("/dining/reserve", lang);
    check(`[${lang}] the form renders, not the closed notice`, !isClosed(html) && html.includes("rsv-date"));
  }

  // ── 3 · the switch propagates, both ways ────────────────────────────────
  await setSettings({ reservationsEnabled: false });
  const offHtml = await getHtml("/dining/reserve");
  check(
    "switching reservations OFF closes the guest page immediately",
    isClosed(offHtml),
    isClosed(offHtml) ? "closed notice shown" : "still showing the form"
  );

  await setSettings({ reservationsEnabled: true });
  const backOn = await getHtml("/dining/reserve");
  check(
    "switching back ON reopens it immediately",
    !isClosed(backOn) && backOn.includes("rsv-date"),
    "no stale closed screen"
  );

  // ── 4 · service hours propagate into the slot list ───────────────────────
  await setSettings({ serviceStart: "11:30", serviceEnd: "22:00" });
  const wide = await getHtml("/dining/reserve");
  const hasLate = wide.includes('value="21:30"') || wide.includes('value="21:00"');
  check("the 11:30-22:00 window offers late-evening slots", hasLate);

  await setSettings({ serviceStart: "17:00", serviceEnd: "20:00" });
  const narrow = await getHtml("/dining/reserve");
  const droppedNoon = !narrow.includes('value="12:00"');
  const keptEvening = narrow.includes('value="18:00"');
  check(
    "narrowing the window to 17:00-20:00 drops the noon slots and keeps the evening",
    droppedNoon && keptEvening,
    `noon gone: ${droppedNoon}, 18:00 present: ${keptEvening}`
  );
  check(
    "the window is stated in the guest copy",
    narrow.includes("17:00") && narrow.includes("20:00")
  );

  // Restore the demo's real window before the booking tests.
  await setSettings({ serviceStart: "11:30", serviceEnd: "22:00" });

  // ── 5 · the hotel's day bounds the date field ────────────────────────────
  const html = await getHtml("/dining/reserve");
  const min = (html.match(/id="rsv-date"[^>]*min="(\d{4}-\d{2}-\d{2})"/) || [])[1]
    || (html.match(/min="(\d{4}-\d{2}-\d{2})"/) || [])[1];
  const bangkokToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  check(
    "the date field's minimum is the hotel's day, not the server's",
    min === bangkokToday,
    `min=${min} bangkok=${bangkokToday}`
  );

  // ── 6 · real submissions, EN and TH, JS on and off ────────────────
  const browser = await chromium.launch();
  //
  // Whether a reservation is legal depends on the DATE, the slot and the switch
  // · never on the current wall clock. The one thing the clock changes is which
  // day the SERVER thinks it is, and on Vercel that is UTC, seven hours behind
  // the hotel. So "late evening" and "just after midnight" are covered by the
  // SLOT and by the past-date case below, not by faking a browser clock
  // (overriding Date in the page breaks React before it can tell you anything).
  const bkk = (offsetDays) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(Date.now() + offsetDays * 86400000));
    return parts;
  };
  const utcToday = new Date().toISOString().slice(0, 10);
  const daysDiffer = utcToday !== bkk(0);
  console.log(
    `\n  clock context · UTC ${utcToday} vs Bangkok ${bkk(0)} · ` +
      (daysDiffer
        ? "THEY DIFFER, so the past-date check below is fully discriminating"
        : "same day right now, so the past-date check proves the rule holds but " +
          "cannot distinguish the two implementations at this hour")
  );

  const CASES = [
    // The late-evening slot · the top of the 11:30-22:00 window.
    { label: "tonight 21:30", date: bkk(0), time: "21:30", expect: "ok" },
    { label: "tomorrow midday", date: bkk(1), time: "12:00", expect: "ok" },
  ];

  for (const c of CASES) {
    for (const lang of ["en", "th"]) {
      for (const js of [true, false]) {
        const ctx = await browser.newContext({
          viewport: { width: 390, height: 844 },
          timezoneId: "Asia/Bangkok",
          javaScriptEnabled: js,
        });
        await ctx.addCookies([{ name: "tkh-lang", value: lang, url: BASE }]);
        const page = await ctx.newPage();
        await page.goto(`${BASE}/dining/reserve`, { waitUntil: "load" });

        const tag = `[${c.label}] [${lang}] [js:${js}]`;
        const body = await page.locator("body").innerText();
        if (isClosed(body)) {
          check(`${tag} form is reachable`, false, "served the closed screen");
          await ctx.close();
          continue;
        }

        await page.fill("#rsv-date", c.date);
        await page.selectOption("#rsv-time", c.time).catch(() => {});
        await page.fill("#rsv-name", qa(`Reserve ${lang} js${js}`));
        await page.fill("#rsv-contact", "+66 80 555 0000");

        // A server action redirects; with JS on that is a client transition, so
        // wait on the URL rather than on a load event that never fires.
        await Promise.all([
          page
            .waitForURL((u) => /[?&](ref|error)=/.test(u.toString()), { timeout: 45000 })
            .catch(() => {}),
          // force · the reveal animations mean this button is never "stable"
          // by Playwright's definition, and waiting for that is what times out.
          page
            .locator('button[type="submit"]')
            .first()
            .click({ force: true, timeout: 30000 }),
        ]);
        await page.waitForTimeout(500);

        const url = page.url();
        const ref = (url.match(/ref=(TBL-[A-Z0-9]+)/) || [])[1];
        const err = (url.match(/error=([a-z]+)/) || [])[1];

        if (c.expect === "ok") {
          check(`${tag} reservation completes`, Boolean(ref), ref || `error=${err || "none"} url=${url.slice(-60)}`);
          if (ref) {
            const shown = await page.locator("body").innerText();
            check(`${tag} the confirmation shows the reference`, shown.includes(ref), ref);
          }
        } else {
          check(
            `${tag} a past date is refused`,
            err === c.expect,
            err ? `error=${err}` : `ACCEPTED as ${ref || "unknown"}`
          );
        }
        await ctx.close();
      }
    }
  }

  // The date field carries min=hotel-today, so a browser will not even submit
  // yesterday · worth asserting, since it is the guest's first line of defence.
  {
    const ctx = await browser.newContext({ timezoneId: "Asia/Bangkok" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dining/reserve`, { waitUntil: "load" });
    await page.fill("#rsv-date", bkk(-1));
    const blocked = await page.evaluate(() => {
      const el = document.querySelector("#rsv-date");
      return el ? !el.checkValidity() : false;
    });
    check(
      "the date field itself refuses yesterday (native min)",
      blocked,
      `min=${bkk(0)}, tried ${bkk(-1)}`
    );
    await ctx.close();
  }

  await browser.close();

  // ── 7 · the SERVER's own rules · the same code path the form uses ────────
  //
  // POST /api/reservations and the form's server action both go through
  // createReservation, so this is the validator the guest hits · reached
  // directly here because a browser will not send a date its input rejected.
  const post = async (body) => {
    const res = await fetch(`${BASE}/api/reservations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  const valid = {
    date: bkk(1),
    time: "19:00",
    party: 2,
    name: qa("Rules"),
    contact: "+66 80 555 0000",
    contactKind: "phone",
  };

  const past = await post({ ...valid, date: bkk(-1) });
  check(
    "the server refuses a date already past AT THE HOTEL",
    past.status >= 400 && /date/.test(JSON.stringify(past.body)),
    `${past.status} ${JSON.stringify(past.body).slice(0, 70)}`
  );

  const offSlot = await post({ ...valid, time: "23:30" });
  check(
    "the server refuses a time outside the service window",
    offSlot.status >= 400 && /time/.test(JSON.stringify(offSlot.body)),
    `${offSlot.status} ${JSON.stringify(offSlot.body).slice(0, 70)}`
  );

  const tooBig = await post({ ...valid, party: 99 });
  check(
    "the server refuses a party over the house maximum",
    tooBig.status >= 400 && /party/.test(JSON.stringify(tooBig.body)),
    `${tooBig.status} ${JSON.stringify(tooBig.body).slice(0, 70)}`
  );

  // And with the switch off, the WRITE path refuses too · it reads the live row
  // uncached on purpose, so a booking cannot land seconds after the owner
  // closes the book.
  await setSettings({ reservationsEnabled: false });
  const whileClosed = await post(valid);
  check(
    "the server refuses a booking while reservations are switched off",
    whileClosed.status >= 400 && /closed/.test(JSON.stringify(whileClosed.body)),
    `${whileClosed.status} ${JSON.stringify(whileClosed.body).slice(0, 70)}`
  );
  await setSettings({ reservationsEnabled: true });

  const good = await post(valid);
  check(
    "a valid booking through the same path succeeds",
    good.status < 400 && /TBL-/.test(JSON.stringify(good.body)),
    `${good.status} ${(JSON.stringify(good.body).match(/TBL-[A-Z0-9]+/) || [])[0] || ""}`
  );


  // Put the settings back exactly as they were.
  await setSettings({
    reservationsEnabled: before.reservationsEnabled,
    serviceStart: before.serviceStart,
    serviceEnd: before.serviceEnd,
  });
  const restored = await (await fetch(`${BASE}/api/hotel`)).json();
  check(
    "settings restored to their original values",
    restored.reservationsEnabled === before.reservationsEnabled &&
      restored.serviceStart === before.serviceStart &&
      restored.serviceEnd === before.serviceEnd,
    `${restored.serviceStart}-${restored.serviceEnd}, enabled=${restored.reservationsEnabled}`
  );

  await purgeQaData();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("FAILURES:");
    failed.forEach((f) => console.log(" ·", f.name, f.detail));
    process.exitCode = 1;
  }
}

main().catch(async (e) => {
  console.error(e);
  await purgeQaData().catch(() => {});
  process.exit(1);
});
