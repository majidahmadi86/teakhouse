# Verification · what to run, and what each thing is actually for

Every script here is `node scripts/<name>.js`. `BASE=https://teakhouse.mikaro.studio`
points any of them at production; without it they use `http://localhost:3000`.

Start the local server through the preview tooling, not `next dev` · the
acceptance bars assume a production build (`next build` then `next start`).

## The suites

| Script | Checks | Expect |
| --- | --- | --- |
| `v11-acceptance` | the standing bars on every v11 route | 36 |
| `v11-booking-concierge` | a stay across a season boundary, priced and booked, plus the concierge's dated answers | 20 |
| `v12-acceptance` | dining and events, owner CRUD through the API, the 1093/1366 widths | 110 |
| `v13-acceptance` | the reserve-a-table flow, owner reservations, image system | 263 |
| `v14-acceptance` | dining/events UX, adaptive contact, nav speed, hotel-timezone dates | 153 |
| `step2-regression` | the older end-to-end sweep · reseeds first | 19 |
| `reserve-bug-check` | the closed-state bug and the reservation rules (below) | 33 |
| `rate-rules-check` | seasonal rates reach both calendars and the booking arithmetic | 11 |

`step2-regression` defaults to the STABLE alias. It used to default to an
immutable per-deploy preview URL, which pinned the whole suite to one old build
and reported its long-fixed faults as current failures.

## The Thai gates

| Script | Checks |
| --- | --- |
| `th-missing` | every dictionary key has real Thai in its `th` slot · expect 0 |
| `th-leakage` | visible English on every rendered surface in Thai · expect 0 across 13 guest and 9 owner routes (`OWNER=1`) |
| `th-meta-audit` | the copy you cannot see: alt text, titles, descriptions, openGraph, and a SOURCE scan for hard-coded English in copy props |
| `th-overflow` | no Thai string clips or wraps at 360/390/1093/1366 · expect 156/156 |

`th-leakage` refuses to grade a surface that rendered nothing. A page with no
text has no English on it, so a fixed wait that expired early used to report
CLEAN · it did exactly that for `/owner/rates` under load.

`th-meta-audit` exists because a rendering audit can only grade what is on
screen. Copy inside a closed modal, the options of a closed `<select>`, and the
untaken branch of a ternary are all invisible to it, and the owner panel was
reported clean while every "Add a dish" dialog was still English.

## Performance

`psi.js` pulls real PageSpeed Insights scores for the five quoted routes on
mobile and desktop and prints a `pagespeed.web.dev` link per row · that link is
the verification, because anyone can click it and Google measures again.
`psi-diagnose.js <route> <strategy>` prints the metric SCORES (which is what the
0-100 is made of), the LCP element and phases, and the heaviest requests.

Both need a key: without one the API answers `429 Quota exceeded` on the shared
anonymous project. `PSI_KEY=... node scripts/psi.js`.

Do not quote local Lighthouse numbers to anyone. The same unchanged build scored
56 and 67 within an hour on the dev machine. Local Lighthouse is only good for a
same-moment A/B against the previous deployment, which Vercel keeps live and
immutable · `npx vercel ls` gives you its URL.

## QA data

The suites write real rows into the real database. Everything they write carries
a `QA_` prefix through `qa()` in `scripts/lib/qa.js`, and `withQaCleanup()`
removes those rows when a suite finishes, fails or throws. `qa-purge.js` clears a
backlog by hand before a demo.

Two traps worth knowing: `process.exit()` inside a suite kills the process before
its cleanup runs (use `process.exitCode`), and killing a suite's shell wrapper
leaves the node child alive · it keeps the Prisma engine open and the next
`prisma generate` fails with EPERM on Windows.

## The reserve closed-state bug

Reported as "Reservations are closed just now" while the owner switch read
Taking bookings, inside the service window. The closed screen has no time
comparison in it: it renders on `!settings.reservationsEnabled` alone.

The cause was `getHotelSettings()` returning its "reservations OFF" fallback from
inside `unstable_cache`, so one unreadable read wrote "closed" into the data
cache for an hour while the owner panel, which reads the live row uncached, kept
disagreeing. A fallback must never be cached: throw inside the cached function
and handle the fallback outside it.

Verify a fix of this shape by fault injection · force the first read to fail and
confirm the SECOND request recovers. Do not try to delete the hotel row to
simulate it; the relations are Restrict, so the delete fails.

Separately, six server-rendered "today" values used the server's clock. Vercel
runs UTC, seven hours behind the hotel, so for those seven hours the site called
yesterday today · including the reservation validator, which would accept a
table for a date already past. All of them now use `hotelTodayIso()`.

## The home route has no i18n provider

`app/(marketing)/layout.tsx` deliberately has no `I18nProvider` · nothing on the
home LCP path may depend on one. Server components there take `locale` as a prop
and `ConciergeMount` brings its own provider for the chat.

So adding `useI18n()` to anything that mounts on home throws "useI18n outside
provider", and the visible symptom is unrelated to the change: the error takes
out the surrounding tree region, the concierge FAB disappears, and
`v12-acceptance` fails on `page.click("[data-concierge-fab]")` while the FAB is
sitting right there in the raw HTML. Pass `locale` down and use
`translate`/`translateEntry` instead. The deferred chain `HomeLate ->
HomeDeferredIslands -> HeroSlideshow -> HeroCrossfade` is all outside the
provider.

When diagnosing this, do not trust the browser pane's console history after a
rebuild · it accumulates per tab and will show you errors from the previous
build. Launch fresh browser contexts against production and localhost side by
side and compare.
