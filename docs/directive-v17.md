# Directive v17 · "FIRST GLANCE" · speed, imagery, booking, engines

Saved verbatim from Mike's brief (2026-10-07), with a live checklist below it. The
checklist is the resume point: any session reads this file, finds the first
unticked item and continues. Tick items only when they have landed and been
verified. The same file lives in both repos (teakhouse, sovra); keep them in sync.

---

## The brief

TEAK HOUSE (3 TO 5 STAR) + SOLENNE (ULTRA LUXURY) · v17 "FIRST GLANCE" · SPEED, IMAGERY, BOOKING, ENGINES
Executor: Claude Code. Repos: teakhouse, sovra. Stack: Next.js + Prisma + Supabase + Vercel.

### STANDING RULES
- LIGHTHOUSE RULE (all Mikaro projects): mobile ≥95 in Performance, Accessibility, Best Practices and SEO on every guest route. Owner panels ≥95 in Performance, Accessibility and Best Practices (SEO excluded, admin stays noindex). Beauty is never traded away to reach it. Both are required.
- Production deploys, production migrations and production seeds only on Mike's "go". By pasting this directive Mike approves PREVIEW deploys for measurement only.
- PREVIEW SAFETY (a preview seed once wiped all Teak House rate rules): before the first preview deploy, prove that no build step migrates or seeds and that previews cannot write to any production database. Only read-only Lighthouse/PageSpeed runs hit previews. Mutating suites run locally against a dev database.
- Development never touches a production database. Dev DB: a separate Supabase dev project if the plan allows, otherwise the embedded-postgres npm package (real Postgres, no Docker, works on Windows). This replaces the failed "local Postgres 17" start.
- Read-only diagnosis first. Act only on facts verified in code and data. One concern per commit.
- Branches: v17-a (Milestone A), then v17-b stacked on it, so A can ship alone.
- No emoji. No em-dash anywhere (copy, dictionaries, DB text, AI prompts, images). Never "built in-house". Real multi-page structure.
- You own language quality in all 16 languages via automated gates. Never ask Mike to check a language.
- Save this directive as docs/directive-v17.md in both repos with a live checklist. Tick items as they land so any session resumes without Mike re-pasting.

### STEP 0 · SETTLE RUNNING WORK
Let the imagery, translation and Teak House agents finish or stop them. Commit finished output on its branch with honest messages. Record anything half-done in docs/directive-v17.md. Measure nothing while heavy jobs run.

### PHASE 0 · DIAGNOSIS (read-only · docs/v17-diagnosis.md in each repo)
1. Databases: which DB each environment (local, preview, production) uses in both repos. Every migration and seed run against each production DB since its last production deploy, including Solenne's estate, journey and agency tables, each marked additive or not. Whether EntityTranslation and the v15 tables are still present and dormant in the Teak House DB.
2. Regions: Supabase region vs Vercel function region per project, with measured round-trip per query from a function.
3. Owner panels (both): per route, every query with count, sequential vs parallel, rows returned and time; TTFB; client JS shipped; middleware work per request; cold vs warm. Name the top causes with numbers.
4. Guest calibration (both): PageSpeed Insights API (mobile, 3 runs, median) and local Lighthouse CLI (mobile, 5 runs, median, idle machine) on the LIVE production URLs. The difference is the local-to-PSI offset. Record LCP element, TBT sources, JS per route, fonts loaded, image weights, and /dining (93 at the 8/13 baseline).
5. Images: inventory every slot in both sites (page, section, what it should show, current file, brightness, resolution, relevant yes/no). Flag every placeholder and every reuse (all Solenne dining venues currently share one photo).
6. Teak House five-star branch: what it changed, its state, and what survives the direction below.
7. Engines: feature inventory of Teak House (v14 base) and Sovra (v16 + 47f366b) against the tier lists below. List the proven v15/v16 modules in sovra history that can be ported to Teak House.

### PRODUCT TIERS (the two must never look or feel alike)
- TEAK HOUSE · 3 to 5 star hotels and resorts. Bright, warm, effortless five-star elegance. The best direct-booking conversion engine in its class, fully OTA-connected, instant to use.
- SOLENNE (Sovra) · ultra-luxury estates. Everything Teak House does, plus the estate, journeys, travel-trade B2B, resources, folios and guest profiles complex luxury properties run on.
- Correctness is never a premium feature: last-unit lock, server re-pricing, hashed passwords and RBAC go into both.

### MILESTONE A · FIRST GLANCE (both sites)

#### A1 · SPEED CONTRACT (guest + owner)
- Guest pages are static or ISR, revalidated by tag on owner edits. Live availability and prices stream in Suspense or load after LCP, never blocking HTML.
- Server components by default. Client islands only for: booking bar, menus and sheets (loaded on open), cursor (desktop, after idle), concierge (on click). No animation library on the critical path; prefer CSS, scroll-driven animations and View Transitions.
- Fonts: at most 2 families and 3 preloaded files, subset, with fallback metrics (CLS 0). Script fonts load only for the active locale.
- Images: LCP image preloaded with fetchpriority high and exact sizes. AVIF first. Mobile hero about 120 KB max. Desktop video only after load, with the poster as LCP. Content-hashed filenames with an immutable 1-year cache (replaces the short cache). Fix /dining dish weight.
- CLS 0 everywhere: explicit dimensions and reserved space for bars and docks.
- Owner panels:
  · Colocate the Vercel function region with the Supabase region.
  · Prisma through the Supabase pooler (transaction mode), with a direct URL only for migrations.
  · Promise.all for independent queries; SQL aggregates for analytics; pagination and date ranges on every list.
  · Per-route code splitting and lazy charts. No DB work in middleware for assets.
  · Designed loading states (no blur, no grey flashes) and prefetch.
  · Targets: warm TTFB under 400 ms, owner page-to-page under 600 ms, dashboard Lighthouse ≥95.
- Security headers stay. Do not move guest pages to nonce CSP (it forces dynamic rendering). Report-only CSP must log zero console errors.
- Measurement:
  · Read-only only. Use the PSI API where the preview is reachable.
  · If a preview is protected, run local Lighthouse with Vercel's protection-bypass header and apply the Phase 0 offset. Local target is max(97, 95 + offset).
  · Owner pages: local Lighthouse with an authenticated cookie.
  · Production is confirmed with PSI after go.

#### A2 · IMAGERY (both sites, every slot)
- Each site gets ONE visual bible in docs/art-direction.md.
  · SOLENNE: one riverside estate. Contemporary Thai pavilions, pale limestone, bleached teak, reflecting pools, frangipani, the river. Bright daylight and clean golden hour, high-key, crisp, natural colour. No haze, smoke or heavy vignette.
  · TEAK HOUSE: one bright contemporary five-star hotel. Warm teak, white stone, tropical green, city and river light, airy and welcoming.
  · Both: no text in images, no faces in focus, never a real or identifiable property.
- If GEMINI_API_KEY or OPENAI_API_KEY exists, generate every slot from its bible plus a per-slot brief.
  · docs/image-briefs.json is built from the real data: each venue, experience, room and hero.
  · Use the provider's strongest current model at its highest resolution.
  · Use a master estate image as reference for consistency where the model supports it.
  · Make 3 variants per slot.
- Without a key: curate Unsplash/Pexels under their licenses with the same briefs. At least 3000 px wide, bright, sets from one shoot per site where possible. Record everything in docs/image-ledger.md.
- Vision QA, mandatory: view every candidate yourself and score it on relevance to its slot, brightness, realism (reject warped lines, odd hands, artifacts, text) and bible consistency. Only the best passes.
- Build docs/contact-sheet.html with every slot, its brief and the chosen image, so Mike can scan everything in one look.
- NO blur placeholders anywhere, ever. Above-the-fold images are preloaded so nothing visibly loads. Below the fold: a dominant-colour ground plus a designed clip-path unveil that starts only after img.decode() resolves, so no half-loaded image is ever shown.

#### A3 · SOLENNE POLISH
- Cursor:
  · The native pointer stays visible at all times, for exact navigation.
  · The luxury layer is a thin follower ring with mix-blend-mode: difference, visible on every background. Zero-lag dot, light lerp on the ring.
  · "View" and "Reserve" labels appear only over rooms and rates.
  · Off over inputs, date pickers, the owner panel, on touch devices and under reduced motion.
- Creative showcase, still restrained:
  · An illustrated interactive estate map (bright, hairline). Tapping a venue opens its card, which links into the Journey Designer.
  · Pinned scrollytelling chapters, full-bleed diptychs, masked headline reveals, and a refined dawn-to-midnight day rail.
  · Every effect holds the Lighthouse rule.
- Remove every remaining dark or smoky treatment. Overlays only as strong as legibility needs.

#### A4 · TEAK HOUSE FIVE-STAR EVOLUTION
- Evolution, not replacement. Keep the name and logo and raise everything else to five-star (reference level: Park Hyatt, Kimpton Maa-Lai, Anantara, Mandarin Oriental). Bright, generous, refined typography, calm motion. Nothing like Solenne and nothing like the rejected gold v15.
- Reposition copy and meta from "Riverside Boutique Hotel" to a five-star hotel, keeping "Demo by Mikaro Studio".
- Rework the room catalogue into five-star categories (for example Deluxe, Premier River View, Junior Suite, Teak Suite, Royal Teak Suite), with five-star rates, sizes, facilities and images. Translate everything.
- Booking is never hunted for:
  · A booking bar on every page and a fixed bottom "Book" bar on mobile.
  · On /book, one always-visible dock showing room, nights, total, deposit and Continue. Selecting a room lands it in the dock.
  · Gate: home to confirmed demo booking in under 60 seconds, with at most one scroll, at 1366x768 and 390x844.
- Audit /book for the bug classes seen in v15 (overlapping layers, duplicated sticky elements, "1 nights", ISO dates). None may exist.

#### A · CLOSE
All gates green, previews measured, then the report and the GO-LIST. Continue straight into Milestone B without waiting. Deploy A the moment Mike says go.

### MILESTONE B · ENGINES

#### B1 · TEAK HOUSE 3 TO 5 STAR ENGINE (port proven sovra modules, do not rebuild)
- Booking core: last-unit lock, server re-pricing quote engine, rate plans (flexible, non-refundable, breakfast included), promo codes, add-ons (transfers, breakfast, late checkout), multi-room booking.
- Distribution and payments: two-way OTA channel sync with signed webhooks and 409 refusals. Payment rails: PromptPay QR, card/Apple Pay/Google Pay, wire. Corporate and agent rate codes (light B2B).
- Thai tax engine: service charge 10% and VAT 7%, configurable. Guests see all-inclusive totals; folio and invoice show the breakdown.
- 16 languages including DB content (the fixed v16 i18n engine plus EntityTranslation) and 13 currencies at live ECB rates.
- Hashed passwords and RBAC replace the raw User.password column, plus the front-desk and housekeeping views.
- Intelligence:
  · A price calendar in the date picker (nightly from-price, cheapest nights highlighted, loaded on open).
  · Smart room match by party and preferences.
  · A concierge that returns a real quote card with Reserve.
  · An owner morning brief: arrivals, occupancy, pace, and three pricing suggestions from the yield rules. Generated once a day, cached, no em-dash.

#### B2 · SOLENNE ULTRA-LUXURY ENGINE
- Travel trade:
  · Agency organisations with multiple users (agent, agency admin) on real sessions. The demo login stays visible.
  · Contracts per agency: commissionable or net rates, agent markup over net, market-specific rate plans, validity and blackout dates.
  · Allotments with automatic release days.
  · Option holds with expiry and reminders.
  · Credit limits, payment schedules (deposit and balance dates), and agency statements and invoices with "++" pricing support.
  · Amendments and cancellations under a policy engine per rate plan.
  · B2B API (availability, rates, holds) with API keys and signed webhooks, reusing the channel infrastructure.
- Proposals:
  · An agent or guest builds the full trip in the Journey Designer: residences, dining, spa, excursions, transfers, celebrations.
  · It becomes a client-facing proposal page, agent-branded or white-label, in the client's language and currency.
  · Quote locked for 24 h, with versioning, expiry, and accept-and-pay through the rails.
  · Markup is never visible to the client.
- Packages: owner-defined templates (honeymoon, wellness retreat, family, celebration) with inclusions, minimum nights and validity. Sold on the site and in the agent portal, fully editable inside the designer.
- Estate operations:
  · Resource scheduling with capacity and conflict checks (spa rooms and therapists, restaurant covers, boats, vehicles, guides).
  · In-stay folio with venue charges posted to the residence.
  · Guest profiles: preferences, dietary notes, celebrations, VIP level, stay history, plus a pre-arrival questionnaire.
  · Group bookings and exclusive-use buyouts.
- Owner intelligence: agent production (room nights, revenue, commission), allotment pickup, proposal pipeline (sent, viewed, accepted), venue utilisation, and a morning brief. The Butler quotes, proposes journeys and places holds.
- Demo data in one bulk pass (clone a valid row per table as the template so every constraint is met at once):
  · 5 fictional agencies in London, Shanghai, Dubai, Moscow and Bangkok, with contracts, allotments, and live proposals in their own languages and currencies.
  · The agent demo login lands in a populated dashboard.

#### B3 · GUIDED DEMO TOUR (both sites)
An optional, refined 6-step tour from the demo bar, about 60 seconds:
- Book as a guest and watch the booking land live in the owner panel.
- Switch to 中文 and USD.
- Open an agent proposal (Solenne).
- See the morning brief.
Prospects feel the engine's power without having to explore.

#### B · CLOSE
Gates green, previews measured, report and GO-LIST (production migrations, bulk seeds, deploys).

### GATES (every milestone, both repos)
- Existing suites green (v11, v14, v15, estate 16/16, reserve-flow), plus the booking-ease timing gates.
- Languages: locale-render on all routes in all 16 languages, locale and DB content coverage at 0 gaps, Thai text-fit and leakage 0.
- Copy: no-emdash, no-emoji, and the no-teak grep in sovra.
- Images: brief and ledger coverage 100%, zero placeholders, zero reused venue images.
- Width sweep 320 to 1920 including 1366 and 1093, JS-disabled readability, zero 404, zero console errors.
- Lighthouse rule met on every guest route and the owner dashboards (medians, table in the report).
- Screenshots to docs/v17-shots/: home, /book or /reserve, owner dashboard, Solenne estate map and a journey proposal. In EN, TH, 中文 and العربية at 1366 and 390, plus the contact sheet.

### REPORT (each milestone, max 20 lines)
- Lighthouse before/after table per route for both sites, guest and owner.
- Gate totals, plus the paths to the screenshots and the contact sheet.
- Anything not done, stated plainly.
- The numbered GO-LIST, ending with "Ready on your word."

---

## Live checklist

Legend: [x] landed and verified · [~] in progress or partial (see note) · [ ] not started.
Repo tags: (T) teakhouse, (S) sovra, (both).

### Step 0 · settle running work
- [x] (both) The three background agents (Solenne imagery, Teak House five-star, estate translations) and the local Postgres all stopped on 2026-10-01 12:35. The translation agent had finished (estate content 0 gaps, committed in 47f366b). The other two died mid-run.
- [x] (S) Half-done imagery parked on branch `wip/v16-imagery` (a044add): partial bright re-curation, heroes re-encoded at 2400/3200, lib/media.ts regenerated with `tone`. Unverified; slots, ledger and files may disagree. Not merged.
- [x] (T) Half-done five-star redesign parked on branch `five-star` (fad357c): 99 deletions, about 50 edits, new site/header/booking components, docs/five-star-design.md, docs/teak-image-ledger.md. No gates were run. Not merged. Phase 0 item 6 decides what survives.
- [x] (S) 47f366b (estate engine) is on local `main`, not pushed. `v17-a` branches from it.
- [x] (T) `v17-a` branches from `main` (fa44219, the live boutique).
- [x] (both) This directive saved with its checklist.
- [x] (both) Dev database: `node tools/devdb/dev-db.mjs` (embedded-postgres, own package.json so Vercel never installs it; data gitignored). Teak House :55432, Sovra :55433, both migrated and seeded fresh on 2026-10-07. The old scratchpad copies were damaged by the 10-01 crash and are set aside in tools/devdb/data-copy-damaged-1001 (not deleted). Local .env and .env.local now point only at the dev database; Teak House production URLs moved to .env.prod-readonly.local (gitignored, loaded by nothing automatically).

### Phase 0 · diagnosis (read-only) → docs/v17-diagnosis.md
- [x] 1 Databases per environment, production migration/seed history, additive or not, dormant v15 tables in Teak House
- [x] 2 Regions and measured per-query round trip
- [x] 3 Owner panel query, TTFB, JS and middleware profile, top causes
- [x] 4 Guest calibration: PSI (3-run median) vs local LH (5-run median), offset, LCP/TBT/JS/fonts/images, /dining
- [x] 5 Image slot inventory, placeholders and reuse
- [x] 6 Teak House five-star branch review
- [x] 7 Engine inventory vs tiers, portable sovra modules

### Milestone A · first glance (branch v17-a)
- [ ] Preview safety proven (no migrate/seed in preview builds, previews cannot write production)
- [~] A1 speed contract, guest (T) (S) · (T) phase 1 architecture landed on v17-a (static/ISR guest routes, server chrome, providers off the guest layout, fonts, image registry; see "Milestone A · phase 1" below). Not yet measured with PSI on a preview; the visual phases still to come must hold it
- [ ] A1 speed contract, owner (T) (S)
- [ ] A2 visual bible, briefs, curation, vision QA, ledger, contact sheet (T) (S)
- [~] A2 no blur anywhere; decode-gated unveil below the fold (T) (S) · (T) the mechanics landed in phase 1 (no blur placeholder anywhere, dominant-colour ground, clip-path unveil after img.decode(), LCP preloads); the imagery itself is phase 4
- [ ] A3 cursor (S)
- [ ] A3 estate map, scrollytelling, diptychs, day rail (S)
- [ ] A3 no dark or smoky treatment left (S)
- [ ] A4 five-star evolution, copy and meta (T)
- [ ] A4 five-star room catalogue, translated (T)
- [~] A4 booking bar everywhere, mobile Book bar, /book dock (T) · the booking bar (StaySearch, a GET form to /book) on every guest page and the static phone Book bar landed in phase 1; the /book dock is phase 2
- [ ] A4 booking-ease timing gate under 60 s at 1366x768 and 390x844 (T)
- [ ] A4 /book bug-class audit clean (T)
- [ ] A gates green, previews measured, screenshots, report, GO-LIST

### Milestone A · phase 1 · architecture (T), branch v17-a
Phase 1 is architecture only: the five-star branch's mechanics without its look, the sixteen-language engine, static guest pages, fonts and the image registry. The visual redesign, the room catalogue and copy (phase 2), translations (phase 3) and imagery (phase 4) are not started.
- [x] 1a Server header, footer and static phone Book bar with no hydrated twin; HeaderSync (scroll state, active page) is the only header island. The phone menu is a native popover with a :target fallback, so it opens without the Popover API and without JavaScript. Currency switching works for every price, room pages included (Price islands on one shared store)
- [x] 1b Providers off the guest layout; /book and /account mount their own; the concierge loads on click (ConciergeLazy)
- [x] 1c StaySearch (a real GET form to /book) on every guest page: the home hero pill, a strip under the header, the room rail. Its labels track the inputs with JavaScript off (the native inputs show); default dates are filled on the client from the guest's own today; one stay-date format everywhere ("Sat 10 Oct → Sun 11 Oct", Intl per language); /book reads in/out/g/room on the server
- [x] 1d Image registry (lib/images.ts, components/Picture.tsx, components/ImagePreload.tsx, build: scripts/images/build-images.mjs): AVIF first, WebP fallback, intrinsic width and height, the LCP preload with exact sizes and fetchpriority high, content-hashed /img and /fonts files with an immutable one-year cache, a dominant-colour ground, the clip-path unveil below the fold that starts only after img.decode(); no blur placeholder anywhere
- [x] 1e Transform-only, scroll-driven motion (still on phones, off under reduced motion); Thai keeps no letter-spacing and Kanit's 1.5 line height; th-overflow reads the header band from --header-h
- [x] 2 Sixteen languages (server-only dictionaries, html lang and dir with Arabic right to left, language menu, per-language fonts) and thirteen currencies at live ECB rates. The fourteen new languages fall back to English strings until phase 3. EntityTranslation added (additive; the v16 migration folder is byte-identical) with lib/content/localize.ts on the menu and events; a stored translation is used only while its source hash matches the current English
- [x] 3 Every guest route static or ISR behind an internal locale segment: middleware rewrites /x to /<lang>/x (language from ?lang, then the tkh-lang cookie, then Accept-Language); the visible URL never changes. Query pages encode their query as a path segment (/book/<in>/<out>/<g>/<room>, /contact/q/..). No cookies() or headers() in a guest render path; canonical URLs kept and hreflang alternates added; owner edits revalidate by tag in every language. scripts/static-routes.js holds it on every build
- [x] 4 Fonts (scripts/fonts/build-fonts.mjs, lib/fonts.tsx): one self-hosted pair per script, and a page links only its own language's pair: Latin Marcellus + Plus Jakarta Sans; Vietnamese Spectral + Plus Jakarta Sans; Cyrillic Forum + Manrope; Thai Kanit + Sarabun (Thai pages only); Arabic Noto Kufi Arabic + Noto Sans Arabic; Devanagari Noto Serif + Noto Sans Devanagari; Chinese, Japanese and Korean Noto Serif + Noto Sans SC/JP/KR as unicode-range slices from a stylesheet that does not block the first paint. Two preloads per page (none for CJK), fallback metrics computed from the font files (CLS 0)
- [x] 5 /dining dish thumbnails at their rendered size (128 px for the 64 px box, 111 KB to 41 KB)

Gates on the final phase 1 commit: tsc clean; static-routes 43/43 (23 guest routes: 3 static, 20 ISR, 0 dynamic); v11 36/36, v12 110/110, v13 263/263, v14 153/153 (also on the final build), reserve-bug-check 33/33 (one run hit an ISR revalidation race on the service-hours check, the rerun passed), th-leakage 0 English lines on 13 routes, th-overflow 156/156, th-missing 0, width sweep 320 to 1920 incl. 1093 and 1366 plus JS-off readability 1768/1768 (EN, TH); hf1-security 141/141; preview-safety --no-runtime 143/143 (the runtime part was not run this phase).

Local Lighthouse, mobile, median of 5 interleaved runs per route (before = d9d21f4, after = phase 1 head, same machine, same database): indicative only, the run was stopped by a priority change and the machine was not idle (benchmark index 600 to 970): /rooms 80 → 83 (LCP 3.76 → 3.15 s), /dining 75 → 76 (LCP 4.50 → 3.18 s), /book 73 → 71 (TBT 645 → 730 ms), CLS 0.001-0.002 → 0 everywhere; home not measured. That run predates 4ac494a, which removed 250 to 800 ms of main-thread work per page (head scripts watching the parser). Server chrome costs HTML weight: about +100 KB raw (+15 KB gzip) and twice the DOM per page, part of it repeated in the RSC payload; worth trimming when phase 2 rebuilds the header. A clean before/after table (PSI with the bypass) is still owed.

Deferred by the orchestrator's priority change: the full Lighthouse before/after and preview-safety's runtime part. Left for later phases: translations of the fourteen new languages (phase 3; 702 of the 741 keys already have a sovra translation of the identical English source to start from); the /book dock, the five-star room catalogue, copy and meta (phase 2); the content pipeline that fills EntityTranslation (phase 3); the Unsplash+ frames and the stand-ins for the eleven retired Unsplash photos (phase 4). The concierge button overlaps the totals on the phone room rail; English fallback text inside an Arabic page flips its punctuation until the strings are translated.

### Milestone B · engines (branch v17-b, stacked on v17-a)
- [ ] B1 Teak House engine (ported modules)
- [ ] B2 Solenne travel trade, proposals, packages, estate operations, intelligence, demo data
- [ ] B3 guided demo tour (both)
- [ ] B gates green, previews measured, report, GO-LIST


---

## Amendment 1 (2026-10-07) · security hotfix first, then Milestone A as planned

Saved verbatim from Mike's amendment. It changes the order of work and supersedes the "Measurement" bullet of A1.

### ORDER ON RESUME
1. Finish the preview-safety work already running (read-only preview mode, fingerprint gate, adversarial review). It stays a prerequisite for every preview.
2. HF-1 below, end to end, including its production deploy.
3. Rebase v17-a in both repos onto the hotfix, then continue imagery and Milestone A as planned.

### HF-1 · PRODUCTION SECURITY + TEAK HOUSE SPEED HOTFIX
- GO: Mike has given his go for HF-1's production changes, for exactly this scope. Nothing else ships.
- Base: cut hotfix/hf-1 from the exact commit serving production now (read it from Vercel), never from local main or a v17 branch.
- One concern per commit. No schema changes. If one turns out necessary, stop and report instead.

TEAK HOUSE
a. Deployment URLs: enable Vercel Deployment Protection so every generated deployment URL (previews and old production deployments) requires Vercel auth, and only teakhouse.mikaro.studio stays public. Old deployments remain as rollback targets. If the API cannot set this, delete the two public v15 deployments and put the one-toggle instruction in the report.
b. CRON_SECRET: generate a strong secret and set it for Production. The cron route fails closed: without a valid "Authorization: Bearer <CRON_SECRET>" it returns 401, including when the variable is missing.
c. POST /api/data/reset: same-origin only, an active demo or owner session required, and a global limit of one reset per 10 minutes via the existing DemoMeta marker. Unauthenticated returns 401.
d. Reseed leaves the guest request path. /book never reseeds. The hourly reseed runs only from the authenticated cron.
e. Every reseed becomes one all-or-nothing transaction (bulk createMany, cloning a valid row as template where needed), so a failure can never leave a half-empty site.
f. Function region to Tokyo (hnd1), next to the Tokyo database. Confirm that crons and every route run there.

SOLENNE
- Audit the same classes: open cron, unauthenticated reset, reseed on request paths, public old deployments carrying production env, non-atomic reseed. Fix anything found under the same scope, on a hotfix branch cut from Solenne's production commit (not 47f366b).
- The v17-a reseed that deletes v15 tables and fails partway gets fixed in code (atomic and schema-correct), not only blocked on previews, because the same code would run in production after go.

HF-1 GATES (local, dev DB)
- v14 suites green.
- New security gate: fire every write and reset path unauthenticated, prove each is refused, and prove the DB fingerprint is unchanged.
- Cron with and without the secret.
- Atomicity: a forced mid-reseed failure leaves the data exactly as before.

HF-1 DEPLOY + VERIFY
- Deploy to production.
- Production smoke: home, /rooms, /book quote, owner dashboard, unauthenticated reset (401), cron without secret (401). Confirm the next scheduled cron run succeeds in the logs.
- Measure Teak House owner TTFB and per-query time, before and after.
- If any smoke check fails, roll back to the previous production deployment immediately and report.

### SPEED TARGET CORRECTION (supersedes "Measurement" in A1)
- PageSpeed Insights is the authority. Target: PSI mobile median of 3 runs ≥96 on every guest route.
- The local floor of 97 is withdrawn. PSI runs about 6 points above local here, so the local proxy target is 92. Re-calibrate if the offset moves.
- Never trim visuals to chase local points PSI already grants.
- If PSI_API_KEY exists in .env.local, use it for every PSI run.
- Previews stay protected. Measure them through the bypass path (the header with local Lighthouse, or the bypass query parameter with the cookie flag for PSI). Production is confirmed with PSI after each go.
- Owner panels: authenticated local Lighthouse against the same proxy target.

### IMAGERY
- If GEMINI_API_KEY or OPENAI_API_KEY now exists, switch Solenne to generation exactly as A2 describes: the estate bible, a master reference image, 3 variants per slot, and vision QA on every image.
- Teak House stays on curated stock. Without a key, both stay on curated stock.
- Never merge wip/v16-imagery; mine it only for single photos that pass the briefs.

### HF-1 REPORT (max 10 lines)
- What was closed on each site, smoke results, owner TTFB before and after, rollback status.
- Then continue straight into imagery and Milestone A.

### Amendment 1 checklist
- [x] (T) Preview safety committed on v17-a and adversarially reviewed; escapes closed: read-only mode refuses ALL raw SQL and any unknown Prisma operation (no classifier left to fool), fails closed (lib/writePolicy.mjs: writable only for VERCEL_ENV=production, or off Vercel against a database genuinely on localhost; next.config.mjs bakes "1"/"0" and refuses VERCEL without VERCEL_ENV), the concierge makes no outbound AI call when read-only, and next is on 14.2.35 (CVE-2025-29927). Gate: node scripts/preview-safety.js 268/268 on the dev DB. (S) done separately in the sovra repo.
- [x] HF-1 Teak House: hotfix/hf-1 cut from the production commit · cut from fa44219 (read from Vercel), deployed as b709563 on 2026-10-07
- [x] HF-1 Teak House a: Deployment Protection on every generated URL (custom domain stays public) · ssoProtection all_except_custom_domains set via the API; the three old deployment URLs answer 302 to Vercel sign-in, teakhouse.mikaro.studio 200; old deployments kept as rollback targets
- [x] HF-1 Teak House b: CRON_SECRET set for Production; cron route 401 without a valid bearer, also when unset · generated in memory, never printed or stored; constant-time bearer check, 401 for missing, wrong or unset
- [x] HF-1 Teak House c: reset same-origin, session required, one per 10 minutes, 401 unauthenticated · server-side owner session (signed cookie keyed from CRON_SECRET); every owner write route requires it; guest writes stay public
- [x] HF-1 Teak House d: no reseed on any guest or request path; reseed only from the authenticated cron · GET /api/data writes nothing; Vercel Hobby allows one cron a day, so the demo refreshes daily (00:00 UTC), not hourly
- [x] HF-1 Teak House e: every reseed one all-or-nothing transaction · one interactive transaction, forced mid-step failures leave the data unchanged
- [x] HF-1 Teak House f: functions in hnd1, crons and routes confirmed there · x-vercel-id sin1::hnd1 on every smoke route
- [x] HF-1 Solenne: audit of the same classes, fixes on hotfix/hf-1 cut from its production commit · cut from c340018, deployed as 58289fb on 2026-10-07: three crons fail closed, request-path reseed removed, atomic reseed, demo sandbox needs a signed demo session, hardened reset, six ungated DELETE handlers gated; old deployments were already protected
- [ ] HF-1 Solenne: v17-a reseed atomic and schema-correct
- [x] HF-1 gates: v14 suites, security gate (every write and reset path refused unauthenticated, fingerprint unchanged), cron with and without secret, forced mid-reseed failure leaves data unchanged · Teak House hf1-security 141/141, v11 36, v12 110, v13 263, v14 153, reserve 33; Solenne hf1-security 65/65, v15 119, v14 155, v11 36 (v12/v13 pre-existing failures identical on c340018)
- [x] HF-1 deployed, production smoke passed, owner TTFB before and after recorded, next scheduled cron confirmed in logs · smoke Teak House 11/11, Solenne 14/14, no rollback; Teak House owner per query 760 to 900 ms -> about 30 ms, one-query API 1.37 to 1.44 s -> 0.30 s, owner HTML 0.58 to 0.70 s -> 0.29 to 0.31 s; crons on 2026-10-08: Teak House reseed 00:44 UTC (verified read-only in the DB: one transaction, seeded counts), Solenne reseed 00:15 UTC and report 02:08 UTC (verified through its API); the Hobby log window had expired, so the evidence is data, not logs
- [x] (T) v17-a rebased onto hotfix/hf-1 (b709563, live in production): the superseded cron commit dropped, every write handler refuses read-only first and then runs HF-1's session, cron and same-origin checks, seedDatabase keeps HF-1's single transaction with the read-only refusal before it opens. HF-1 gate 141/141, v11 36/36, v12 110/110, v13 263/263, v14 153/153, reserve-bug-check 33/33, th-missing 0, tsc clean. (S) done separately in the sovra repo.
