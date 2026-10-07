# v17 · Phase 0 diagnosis · Teak House

Date: 2026-10-07 · Repo: D:/WorkSpace/projects/customers/teakhouse · Branch: v17-a (4034872, app code identical to main fa44219, which is live on teakhouse.mikaro.studio) · Read-only diagnosis per docs/directive-v17.md, PHASE 0.

Conventions: every claim cites a file:line, a command output or a measured number. "Inferred" marks reasoning that was not measured. "(corrected on verification)" marks a claim a verifier refuted or narrowed, with the correction applied. "(recomputed while writing)" marks numbers recomputed during the write-up because the first pass used a flawed method. Scratch scripts and raw data: `C:/Users/MAJID/AppData/Local/Temp/claude/D--WorkSpace-projects-customers-teakhouse/f1305d26-eac0-483c-a4c3-915820181d9c/scratchpad/v17-phase0/`. No secret values appear here; database hosts are named by hostname or region only.

## Summary of findings

1. Preview safety is not proven: Preview has its own DATABASE_URL and DIRECT_URL, but they are Sensitive and unreadable, so a preview must be treated as production; Git integration creates a preview for every pushed branch, there is no deployment protection, and SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are one entry for Production and Preview (item 1).
2. Anonymous requests can wipe and rewrite the database of any deployment: GET /api/cron/reseed is open (CRON_SECRET unset), GET /api/data reseeds when the marker is over 1 h old and is fetched by /book, /account and /owner (so a Lighthouse run of /book can be a DB write), and POST /api/data/reset has no auth; no build step migrates or seeds (items 1, 3).
3. Two old v15 production deployments (4b99cd9, 62e316d) are still public and carry production env; their /api/data would run the v15 reseed against the live DB (inferred from code, not exercised) (item 1).
4. Functions run in iad1 (Washington) and the database in ap-northeast-1 (Tokyo): one Prisma call costs about 780 ms from the function, against about 13 ms on colocated Solenne; vercel.json pins no region (item 2).
5. Owner panel: nothing renders on the server and the shell waits for /api/data (2 sequential DemoMeta statements, one an UPDATE, then 4 unbounded reads); content takes 1.0 to 1.16 s locally even with 4 to 14 ms APIs, warm 1-query owner APIs take 1,176 to 1,180 ms on production, the dashboard scores 82 on local Lighthouse, and there is no server-side owner auth (item 3).
6. Guest calibration: PSI minus local Performance is +17, +1 and +1 (median +1; Solenne +7, +5, +14; median over both sites +6) and 0 for A, BP and SEO; locally 8 of 12 guest routes score under 95 on Performance (lowest: / 81, /contact 83), and the top TBT source on every route is Next's app-router chunk 7023 (item 4).
7. /dining scores 90 locally (all 5 runs) and 91 on PSI against the 93 baseline; its LCP is a 106 KB hero, its 21 images weigh 321 KB with 256 px dish thumbs in 64 px boxes, and files already in the repo would cut about 140 KB on mobile (items 4, 5).
8. Images: 11 dead Unsplash hotlinks leave 16 slots blank, a Krabi beach stands in for the Chao Phraya 5 times, the home mobile LCP is upscaled (sharpness 0.30), there is no OG image, public/ images are served with max-age=0, two frames are Unsplash+ (licence risk), and of 56 non-dish photographs only 10 fit the brief (25 partial, 21 no); A2 needs about 111 slots (item 5).
9. The five-star branch type-checks clean but is unverified at runtime: port its architecture (server header and footer, lazy concierge, stay search, picture and preload mechanics, transform-only motion) and drop its visual identity, a near copy of the rejected v15 palette; the five-star room catalogue and positioning were never started (item 6).
10. Production DB: 8 migrations, all additive, none since the live deploy; the v15/v16 tables (EntityTranslation 1,764 rows, StaffUser 4) are present and dormant in code, RLS hardening is applied although the GO-LIST says otherwise, and every reseed replaces all 50 SeasonalPriceRule rows; for B1, most engine items are absent but the sovra v15 modules are unchanged from teakhouse 4b99cd9 and portable (items 1, 7).

## 1 · Databases

Read-only throughout. Production was read inside `BEGIN; SET TRANSACTION READ ONLY` (`SHOW transaction_read_only` = `on`, DB TimeZone `UTC`) at 2026-10-07 02:02 and 02:20 UTC. Scratch scripts: th-prod-read.cjs, th-prod-read2.cjs, th-prod-match.cjs, plus the verifier's vf-thprod.cjs and vf-thprod3.cjs. All ten item-1 claims were confirmed on verification.

### 1a · Which database each environment uses

| Environment | Database | Evidence |
|---|---|---|
| Local | embedded-postgres `localhost:55432` | `.env` and `.env.local` set DATABASE_URL and DIRECT_URL to localhost:55432. Both files were rewritten 2026-10-07 01:53:04 UTC. Before that, the local `.env` pointed at production (memory note teakhouse-demo-reset-timeout; directive step 0). |
| Production | Supabase Postgres 17.6. Pooler `aws-0-ap-northeast-1.pooler.supabase.com:6543` (pgbouncer), direct host `db.<ref>.supabase.co:5432` | The DB in `.env.prod-readonly.local` is the live one: the 5 SeasonalPriceRule ids that `GET https://teakhouse.mikaro.studio/api/rooms/family-annex/pricing` returns match the DB's ids for that room exactly (th-prod-match.cjs: identicalIdSets=true; re-run on verification: liveCount=5, dbCount=5, identical=true; the GET handler at `app/api/rooms/[id]/pricing/route.ts:61-71` only reads). Vercel has one DATABASE_URL and one DIRECT_URL entry scoped Production (type sensitive, created 2026-08-10 06:15:41Z and 06:16:43Z). Item 2 adds a discriminating proof (pg_stat_statements deltas). |
| Preview | **Unknown, so treat it as production** | Preview has its own DATABASE_URL and DIRECT_URL entries, scoped Preview only (sensitive, created 2026-08-10 06:17:46Z and 06:16:50Z, never updated). `vercel env pull --environment=preview` returns `[SENSITIVE]` (checked on verification in a scratch copy, pulled file deleted), so the values cannot be compared. Evidence that a non-current deployment has hit the live DB before: `scripts/restore-rate-rules.js:4-9` (a reset run against an older deployment deleted the live SeasonalPriceRule rows), and directive line 18. Verifier caveat: that script comment is about an older production deployment, not Preview, so "treat as production" is a precaution, not a measured fact. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are a single entry for Production+Preview, so preview media uploads go to the production Supabase project (its `storage` schema, 8 tables, is in the same Postgres). |

- **Does Preview have DATABASE_URL/DIRECT_URL?** Yes. Their values are unreadable, so assume a preview reaches the production DB.
- **Current deployments.** The deployments API returns only 4, all production, all READY:
  - fe811bc (2026-08-13)
  - 4b99cd9 and 62e316d (v15, 2026-09-27)
  - fa44219 (2026-09-30 08:18:31Z), which is live on teakhouse.mikaro.studio
- **No preview deployments exist.** Git integration still creates one for every pushed branch (`createDeployments: enabled`). The remote also has branches `feature/v8-system` and `cursor/*`.
- **No deployment protection** (`ssoProtection: null`, `passwordProtection: null`). All 4 deployment URLs return 200 for `/apple-touch-icon.png` (4616 B image/png; a static file the middleware matcher skips).
- **Old builds are live.** The two v15 builds still serve their own code with production env (inferred: Vercel bakes env vars at deploy time, and the production entries are unchanged since 2026-08-10). At 62e316d (identical in 4b99cd9), `app/api/data/route.ts:9-15` calls requireStaff and then maybeReseedDemo; getStaffActor returns a sandbox owner when DEMO_MODE is true and AUTH_ENFORCE is not "true" (`lib/auth/session.ts:44-49,142-150`), and AUTH_ENFORCE is not in the project env. So an anonymous GET `/api/data` on a v15 deployment URL would run the v15 seedDatabase (deleteV15 then seedV15, 62e316d `lib/seedDatabase.ts:909,1204`) against the live DB. Inferred from code; not exercised.
- **v17-a matches production.** v17-a has no code diff from fa44219 in app, lib, components, prisma, middleware.ts, package.json or vercel.json. fa44219 also has no code diff from fe811bc in those paths (`git diff --stat fe811bc fa44219` is empty for them).

**Build steps.**
- `package.json:7` is `"prisma generate && next build"`.
- There is no postinstall, prebuild or vercel-build script and no CI workflow (no `.github`, no `.husky`).
- The Vercel buildCommand is null.
- No build step migrates or seeds in any environment.

**Cron.**
- `vercel.json:2-6` defines `GET /api/cron/reseed` at `0 0 * * *`. The project crons API shows it bound only to the production deployment.
- `app/api/cron/reseed/route.ts:10-14` checks CRON_SECRET only when it is set (`if (secret && ...)`). CRON_SECRET is not in the Teak House env (`vercel env ls`; team shared env count 0), so the route is unauthenticated.
- Lines 21-33 reseed via maybeReseedDemo, or else force seedDatabase(), when DEMO_MODE is "true" (lines 15-20). DEMO_MODE is Sensitive, but the DB shows all boutique rows rewritten at 2026-10-07 01:51, outside the 00:00 cron slot, so reseeds do run (DEMO_MODE=true inferred). Any GET of that path on production, a preview or an old deployment wipes and rewrites that deployment's DB.

**Every DB write path from a deployed build or request.**
- No API route has server-side auth. The only auth check under app/api is the optional CRON_SECRET above. Owner login is a client-side PIN check (`lib/ownerStore.ts:205-207`); NEXT_PUBLIC_OWNER_PIN is not in the Vercel env, so the hardcoded fallback in the source applies (the value ships in the public bundle and is not reproduced here).
- Middleware does no DB work.
- All GET handlers are read-only except `/api/data`, `/api/cron/reseed` and `/api/email-template` (GET runs `ensureTemplate()`, which creates the row when it is missing, `app/api/email-template/route.ts:14-27`; added from item 3).

| Path | Writes | Trigger | Runs on a preview? |
|---|---|---|---|
| GET /api/cron/reseed | full reseed | Vercel cron (production only), or anyone | yes, if requested |
| GET /api/data | `demoMeta.updateMany` on every call, and `maybeReseedDemo` (`lib/demoReset.ts:28-60`) reseeds inline when DemoMeta.lastReset is over 1 h old | OwnerProvider fetches it on mount (`lib/ownerStore.ts:122-125,159-167`) on **/book, /account** and /owner (`app/(guest)/book/layout.tsx:14`, `account/layout.tsx:14`, `owner/layout.tsx:28`) | yes. **A Lighthouse or PSI run of /book or /account is a DB write** whenever the marker is stale |
| POST /api/data/reset | full reseed (maxDuration 60), no auth and no DEMO_MODE check (`app/api/data/reset/route.ts:11-13`) | owner "Reset demo data" (`lib/ownerStore.ts:230`) | yes |
| GET /api/email-template | creates the template row when missing | owner Settings | yes |
| Owner CRUD | POST /api/blocks; POST /api/bookings, PATCH/DELETE /api/bookings/[id]; POST /api/contact, PATCH/DELETE /api/contact/[id]; dining categories/items POST, PATCH, DELETE; email-template PATCH/POST; event-requests/[id] PATCH/DELETE; events POST/PATCH/DELETE; PATCH /api/hotel; reservations/[id] PATCH/DELETE; rooms POST/PATCH/DELETE; rooms/[id]/pricing POST/PATCH/DELETE (SeasonalPriceRule); POST /api/users; POST /api/media (Supabase Storage) | anyone | yes |
| Guest server actions | `contact/actions.ts:49` (ContactMessage), dining/reserve via `lib/reservationService.ts:35` (TableReservation), events/reserve via `lib/eventRequestService.ts:37` (EventRequest) | guests | yes |

**PREVIEW SAFETY verdict:** a preview *build* writes nothing. A preview *at runtime* can anonymously write to whatever its DATABASE_URL points at, including a full reseed triggered just by loading /book. We cannot prove that DB is not production.

### 1b · Production migrations and seeds

Live code is fa44219, deployed 2026-09-30 08:18:31 UTC. `_prisma_migrations` has 8 rows, none rolled back, none with logs.

| Migration | finished_at (UTC) | In teakhouse repo | Additive? |
|---|---|---|---|
| 20260810051316_init_v8_postgres | 2026-08-10 05:13:17 | yes | additive (10 CREATE TABLE, indexes, FKs) |
| 20260812120000_v11_per_day_pricing | 2026-08-12 08:33:35 | yes | additive plus one relaxation: ADD `kind` NOT NULL DEFAULT, ADD `price` NULL, `multiplier` DROP NOT NULL (no data change), new index |
| 20260812112224_v12_dining_events | 2026-08-12 11:22:25 | yes | additive (3 tables) |
| 20260812133327_v13_reservations_media | 2026-08-12 13:33:28 | yes | additive (6 Hotel columns NOT NULL with DEFAULT, 1 table) |
| 20260812133943_v13_dining_media | 2026-08-12 13:39:44 | yes | additive (2 columns NOT NULL DEFAULT '') |
| 20260812192352_v14_event_requests_contact | 2026-08-12 19:23:53 | yes | additive (2 tables) |
| 20260927090000_v15_eight_star | 2026-09-27 04:39:15 | **no** (sovra only) | additive: 24 columns (Hotel 7, Room 3, Booking 11, Guest 3), each nullable or NOT NULL with DEFAULT; 13 tables; 2 Booking indexes (one UNIQUE over two new all-NULL columns); FKs |
| 20260928090000_v16_entity_translation | 2026-09-28 03:57:32 | **no** (sovra only) | additive (1 table, RLS on it, REVOKE anon/authenticated on it) |

- **No migration since the last production deploy** (last finished_at 2026-09-28 03:57:32Z, deploy 2026-09-30 08:18:31Z).
- **v15 and v16 were applied from outside Vercel (inferred).** v15 landed 3 h 37 min before the first v15 deploy. v16 was never deployed to this project. Teak House builds never migrate, so both were inferred to come from local runs while `.env` pointed at production.
- **Checksums.** Production checksums equal the LF content of the repo files (for example init f50138bdf055). In the teakhouse working tree, init and v12 are CRLF, so their on-disk sha256 differs by line ending only.
- **Unrecorded DDL: RLS hardening, applied at an unknown time.** It is not in `_prisma_migrations`. Its fingerprint:
  - all 31 public tables, `_prisma_migrations` included, have `relrowsecurity=true`, FORCE off and 0 policies;
  - `information_schema.role_table_grants` has 0 rows for anon or authenticated, and `pg_class.relacl` read with aclexplode has 0 anon/authenticated entries (all 31 tables share `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`);
  - the default ACL for postgres-owned tables lists only postgres and service_role;
  - postgres-owned *sequence* and *function* defaults still grant anon and authenticated.

  That last point matches `docs/go-list/teakhouse-rls-hardening.sql:15-31` exactly, since the script revokes table defaults only (lines 24, 29). It does not match Sovra's `20260929090000_sovra_rls_everywhere`, which also revokes sequence defaults. The GO-LIST at fa44219 still says "NOT APPLIED". This is a privilege change only, with no schema or data change.
- **Seeds since the deploy.** Only demo reseeds, through the paths in 1a.
  - The current rows were written 2026-10-07 01:51:47.367 to 01:51:56.815 UTC (Hotel.createdAt to DemoMeta.lastReset, 9.4 s). Timestamps were read as stored text; reading these columns through node-pg as Date shifts them by the local +07:00 offset (shows 2026-10-06 18:51Z).
  - That run finished 67 s before the local `.env` files were rewritten (01:53:04Z) and 4 min before the dev DB was migrated (01:55:37Z). Whether it came from a local process or a production request is **unknown**.
  - Reseeds cannot be split before and after the deploy. pg_stat counters since 2026-07-24 show Room n_tup_ins 1470 (about 147 full seeds of 10 rooms), SeasonalPriceRule ins 5490 / del 5434, DemoMeta ins 130.

**Public tables (exact count(*), RLS on for all, 0 policies):**

- **Boutique (in the main schema):** Booking 40, ContactMessage 0, DemoMeta 1, DiningCategory 3, DiningItem 18, EmailTemplate 1, EventRequest 0, Guest 15, GuestBooking 2, Hotel 1, HotelEvent 3, Room 10, RoomBlock 0, SeasonalPriceRule 50 (10 rooms), TableReservation 0, User 1, `_prisma_migrations` 8.
- **v15/v16 (not in the main schema):** Addon 8, AuditLog 1, Channel 3, ChannelRoomMap 0, EntityTranslation 1764, GuestNote 0, InboundEvent 0, OutboxEvent 0, Payment 0, Report 1, ServiceRequest 3, StaffSession 0, StaffUser 4 (password hashes), YieldRule 3.
- **Estate tables** (Venue, Experience, Agent, AgentSession, Journey, JourneyItem): absent.
- **Drift against the main schema** (compared with the local dev DB built from teakhouse migrations): the 24 extra v15 columns and 2 extra Booking indexes are the only differences. No column is missing and there is no type or null drift.
- **Ownership:** postgres owns all 31 tables, so RLS does not restrict the app.

**Are the v15/v16 tables dormant?** In code, yes.
- A case-sensitive `git grep -w` of the 14 model names on fa44219 (docs excluded) finds only two i18n labels (`lib/i18n-dict.ts:575` "Channel mix", `:634` "Payment").
- `prisma/schema.prisma` on main has 16 models, none of them v15.
- Their last writes predate the boutique deploy:
  - Channel, Addon, StaffUser, YieldRule and ServiceRequest: 2026-09-30 00:44:41 to 00:45:07Z.
  - Report and AuditLog: 01:42:57 to 59Z. Inferred to be the v15 nightly crons.
  - EntityTranslation updatedAt: 2026-09-28 05:19:53Z.

They are **not inert**. These FKs (pg_constraint) mean every boutique reseed deletes or updates rows in them, because the boutique seed deletes Booking, Guest and Room (fa44219 `lib/seedDatabase.ts:909,910,913`):
- Payment→Booking CASCADE
- GuestNote→Guest CASCADE
- ChannelRoomMap→Room (and →Channel) CASCADE
- ServiceRequest→Booking SET NULL

Payment, GuestNote and ChannelRoomMap are now 0 rows (pg_stat ins/del 395/395, 40/40, 300/300), and all 3 ServiceRequest.bookingId values are NULL. A reseed today cascades over 0 rows; the cascade is the mechanism that emptied them (inferred).

### 1c · Demo reset on production

`lib/seedDatabase.ts:903-1195`:
- Deletes all 16 boutique tables one after another (lines 906-924), with no transaction (no `transaction` anywhere in the file; callers `cron/reseed/route.ts:26`, `data/reset/route.ts:13`, `demoReset.ts:54` do not wrap it).
- Then writes one createMany per table: Hotel 1, Room 10, **SeasonalPriceRule 50** (990-991; per room: High season ×1.1 from 1 Dec to the end of Feb, Songkran override ×1.35 on 13-15 Apr, weekend premium, and so on), Booking 40, Guest 15, EmailTemplate 1, DemoMeta 1, User 1, DiningCategory 3, DiningItem 18, HotelEvent 3.
- TableReservation, ContactMessage, EventRequest and RoomBlock are left empty.

**How often:**
- Daily cron 00:00 UTC (Hobby fires within the hour, inferred).
- At most hourly on demand through GET /api/data (owner, /book, /account).
- At any time through POST /api/data/reset or the unauthenticated GET /api/cron/reseed.

**Rate rules:** yes. Every reseed deletes all SeasonalPriceRule rows (`lib/seedDatabase.ts:908`) and writes the 50 seeded ones (`:991`), so owner rate edits never survive a reseed.

## 2 · Regions

Measured 2026-10-07, 02:06 to 02:14 UTC, against production deployment `dpl_C22uSdJ3aWfr21P58W56kmL3eX3u` (commit fa44219, created 2026-09-30T08:18Z). App code on v17-a is identical to fa44219: `git diff --name-only fa44219 HEAD` lists only .gitignore, docs/ and tools/devdb/. All item-2 claims were confirmed on verification (re-measurements in `verify-item2/`).

**Vercel function region: iad1 (Washington, D.C.)**
- `vercel.json` has no `regions` key. It holds crons only, in the working tree and at fa44219.
- Project default, from `vercel api /v9/projects/prj_SLvK…`: `serverlessFunctionRegion: iad1`, `resourceConfig.functionDefaultRegions: ["iad1"]`, `fluid: true`.
- The production deployment reports `regions: ["iad1"]` (`vercel api /v13/deployments/dpl_C22u…`).
- On the live site, every dynamic response carries `x-vercel-id: sin1::iad1::…`: /, /rooms, /book, /api/media, /api/rooms and /api/hotel. All return `x-vercel-cache: MISS`. The edge is sin1 and the function runs in iad1.

**Supabase region: ap-northeast-1 (Tokyo)**
- In `.env.prod-readonly.local` (hostnames only):
  - DATABASE_URL (line 3) points to `aws-0-ap-northeast-1.pooler.supabase.com:6543` with `pgbouncer=true`, the transaction pooler, and no `connection_limit`.
  - DIRECT_URL (line 4) points to `db.<ref>.supabase.co:5432`.
- DNS checked against AWS `ip-ranges.json` (createDate 2026-10-06-22-37-06):
  - The pooler's 3 A records all fall in ap-northeast-1 (52.68.0.0/15, 54.64.0.0/15, 35.72.0.0/13).
  - The direct host is IPv6-only. Its AAAA record is in 2406:da14::/35, which is also ap-northeast-1.
- A read-only probe (`BEGIN READ ONLY`, `transaction_read_only=on`, SELECTs only, then ROLLBACK) returned Postgres 17.6 and `TimeZone=UTC`. That gives no region signal.
- **This is the database the live site uses.** Live `GET /api/rooms` returned 10 rooms whose (id, slug, rate) values match the DB's `Room` rows exactly and in the same order (handler `prisma.room.findMany({orderBy:{rate:"desc"}})`, `app/api/rooms/route.ts:10`). Verifier caveat: the row match alone cannot tell databases apart, because the local dev DB holds the same 10 rows. The discriminating read-only check: pg_stat_statements calls for Prisma's Room ORDER BY rate DESC statement in the Tokyo DB went 1067 to 1073 (delta 6) after 6 live GET /api/rooms calls, then 1073 to 1076 (delta 3) after 3 calls, while other Room statements showed delta 0 (`verify-item2/stmtdelta.cjs`) (strengthened on verification). On Vercel the variables themselves are type `sensitive` and cannot be read (DATABASE_URL and DIRECT_URL for production were last updated 2026-08-10).

**Measured cost per query from the production function**

Routes were read in code and are GET only, with no writes. Middleware skips `/api` (`middleware.ts:55`).

| Route | Prisma calls | Order | Source |
|---|---|---|---|
| `/api/media` | 0 | (none) | `app/api/media/route.ts:22-28` (env read only) |
| `/api/rooms` | 1 | (single call) | `app/api/rooms/route.ts:10` |
| `/api/hotel` | 1 | (single call) | `app/api/hotel/route.ts:65` |
| `/api/rooms/family-annex/pricing` | 2 | sequential (`findFirst`, then `findMany`) | `app/api/rooms/[id]/pricing/route.ts:62-69` |

Method:
- Each route got 2 warm-up calls, then 10 interleaved rounds per run.
- "TTFB" is curl `time_starttransfer`.
- "srv" is `time_starttransfer - time_pretransfer`. It strips client DNS, TCP and TLS time.

| Median (ms) | nodb | 1q rooms | 1q hotel | 2q pricing |
|---|---|---|---|---|
| TTFB run 1 (02:06Z) | 434.3 | 1230.0 | 1206.4 | 1990.8 |
| TTFB run 2 (02:12Z) | 448.2 | 1185.2 | 1189.8 | 1959.3 |
| srv, both runs pooled (n=20) | 279.9 | 1057.9 | 1053.5 | 1837.7 |

- **Per query, by the task's formula:**
  - Run 1: (1990.8 - 434.3) / 2 = **778 ms**. The 1-query routes give 796 and 772 ms.
  - Run 2: 756 ms.
  - Pooled srv: 778, 774 and 779 ms over nodb. The slope from 1 query to 2 is 780 and 784 ms.
  - Independent resample on verification (n=8): srv nodb 284.1, rooms 1068.6, hotel 1043.8, pricing 1812.8; estimators 744.2 to 784.4 ms.
  - So **one Prisma read costs about 780 ms**.
- **Assumption: the queries run one after another.** The 1-query increment (778 ms) equals the per-query slope from 1 to 2 queries (780 ms). So a warm request pays no extra cost to open a connection; it reuses a pooled connection under Fluid (inferred).
- **Why one read takes 780 ms:**
  - Prisma 5.22's network flights were counted locally against the local dev DB through a counting TCP proxy (`rttdecode.js`, `rttcount.js`; reproduced on verification with `verify-item2/flights.js`).
  - With `pgbouncer=true`, one warm `room.findMany` sends 5 flights in sequence: `BEGIN`; `DEALLOCATE ALL`; Parse/Describe/Sync; Bind/Execute/Sync; Close and `COMMIT`.
  - Without the flag, a cached statement needs 1 flight (2 on the first call).
  - With 50 ms added to each server reply, pgbouncer mode took 311.4 to 318.4 ms per call against 63.7 to 64.8 ms warm without the flag.
  - A `findMany` with one `include` (2 statements, e.g. diningCategory with items) costs 7 flights with the flag against 2 warm without it.
  - 780 / 5 gives about 156 ms per iad1 to Tokyo round trip (inferred, not measured directly).
- **The extra hop for guests:** the no-DB route's srv median is 280 ms here against 62 ms on Solenne, from the same client and the same sin1 edge (resample: 284.1 against 64.0 ms). That suggests about 218 ms per dynamic request is spent on the sin1 to iad1 hop before any query runs (inferred).
- **Context from this machine** (re-measured on verification within about 2 ms):
  - TCP connect, 10 samples: 102.8 ms median to the Tokyo pooler, 101.7 ms to the direct host (IPv6).
  - `select 1`: 104.7 ms through the pooler, 98.9 ms direct.
  - Full pg connect (TCP, TLS and auth): 672 ms through the pooler, 817 ms direct.
  - A Prisma read inside a read-only interactive transaction: 216 to 234 ms, about 2 round trips. Inside a transaction there is no BEGIN/COMMIT wrapper (inferred).

**Conclusion: not colocated.**
- Functions run in iad1 (Washington, D.C.). The database is in ap-northeast-1 (Tokyo), reached through the transaction pooler with `pgbouncer=true`.
- **Measured cost: about 780 ms per Prisma call**, and a route with N sequential calls pays N × 780 ms. On Solenne, where the function and database are colocated (sin1 and ap-southeast-1), one call costs about 13 ms.
- vercel.json does not pin a region, so every deployment inherits the project default, iad1.
- Possible fixes (inferred, not measured):
  - Pin `"regions": ["hnd1"]`, Vercel's Tokyo region.
  - Or move the database next to the function region.
  - Separately, the 5-flight `pgbouncer=true` pattern multiplies whatever round trip remains.

## 3 · Owner panel

Two passes: a static code profile (branch v17-a, app code identical to main fa44219), then measurements (production curl, read-only; local `next start` against the dev DB). Dev row counts come from read-only `SELECT count(*)` in a READ ONLY transaction on localhost:55432. Production row counts (item 1, read-only) are identical for the owner tables: Room 10, Booking 40, RoomBlock 0, SeasonalPriceRule 50, because every reseed writes the same seed. Live per-route JS sizes come from plain GETs of the owner HTML and the immutable `/_next/static` chunks (no JS executed, no `/api/*` called); the live chunk 57 contains this store's `/api/data/reset` and `live data unavailable` strings, so the live build matches this code (inferred; item 1 confirms production runs fa44219).

### 3a · Routes, data loading and queries

**Server side:** none of the owner routes queries the database.
- The 9 `page.tsx` files are all `"use client"`. Each one is only a `dynamic(() => import("./XClient"), { ssr: false, loading: OwnerSkeleton })` wrapper (app/owner/page.tsx:1-13, app/owner/*/page.tsx; rates/page.tsx:7-17 also wraps in `<Suspense>`).
- `app/owner/layout.tsx` reads only the locale cookie (`getServerLocale()` at :12 and :23, which is `cookies().get("tkh-lang")`, lib/serverLocale.ts:11-14) and renders `Providers > DemoModeBar > DemoModal > OwnerStoreProvider > OwnerShell`.
- `grep prisma|@/lib/db` over app/owner, components/owner and the layout's components finds nothing.
- Of 31 .tsx files in app/owner, 21 are client components. The other 10 are the layout and 9 `loading.tsx` skeletons (no data work).

**Shared store:** the layout loads one store for every page.
- `OwnerProvider` (lib/ownerStore.ts:154-194) fetches `GET /api/data` once per full page load (`cache: "no-store"`, :122-126). `refresh()` (:196-203) re-fetches it after a failed mutation.
- Client navigation inside /owner keeps the layout mounted, so it does not refetch.
- `OwnerShell` returns a spinner until that fetch settles (`if (!hydrated || isDesktop === null) return <Spinner />`, app/owner/OwnerShell.tsx:178).
- The same provider also mounts on the guest `/book` and `/account` layouts.
- Store users: BookingsClient:213, CalendarClient:48, DashboardClient:131, RatesClient:61, RoomsClient:75, LoginScreen:11. DiningClient, EventsClient, MessagesClient and SettingsClient import none of it.

| Route | Store data used | Extra client fetches after the store hydrates | Order |
|---|---|---|---|
| /owner (Dashboard) | rooms, bookings | none · KPIs, 6-month revenue, occupancy and channel mix are computed in the browser over all bookings (DashboardClient.tsx:88-120, 144-221) | n/a |
| /owner/bookings | bookings, rooms | none · renders every filtered booking with no pagination, as a desktop table and as mobile cards, both in the DOM (BookingsClient.tsx:265-280, 469, 507) | n/a |
| /owner/rooms | rooms | `/api/media` only when the edit modal opens (RoomsClient.tsx:577 inside the Dialog at :282-668) | n/a |
| /owner/rates | rooms, priceRules | none | n/a |
| /owner/calendar | rooms, bookings, blocks | none · computes rooms x days of `getCell` twice (heat map and grid, CalendarClient.tsx:84-101, 284) | n/a |
| /owner/dining | not used | `/api/dining`, then `/api/reservations` + `/api/hotel` + `/api/media` | waterfall: the panels mount only after the menu arrives (`if (categories === null) return <OwnerSkeleton />` at DiningClient.tsx:215, `<ReservationsPanel />` at :233). The panel then runs `Promise.all` of reservations and hotel (ReservationsPanel.tsx:70-74), and its 2 ImageUploadFields probe `/api/media` (:227-240, ImageUploadField.tsx:17-25, 84-92) |
| /owner/events | not used | `/api/events`, then `/api/event-requests` | waterfall: `if (events === null) return <OwnerSkeleton />` at EventsClient.tsx:132, then `<RequestsPanel />` at :152 fetches (RequestsPanel.tsx:37-49) |
| /owner/messages | not used | `/api/contact` | single fetch (MessagesClient.tsx:53-65) |
| /owner/settings | not used | `/api/hotel` + `/api/email-template` | `Promise.all` (SettingsClient.tsx:36-48) |

Four routes (dining, events, messages, settings) never read the store but still wait for `/api/data` on a cold load, because OwnerShell gates every child on it.

**Prisma work per endpoint.** Prisma 5.22 uses the default relation strategy, so each `include` costs one extra query (and, under `pgbouncer=true`, 2 extra network flights, item 2). The JSON size is the measured response of the repo's `loadOwnerData()` against the dev DB.

| Endpoint (file) | Prisma calls | Seq / parallel | Filters, take, date range | Dev rows · JSON |
|---|---|---|---|---|
| GET /api/data (app/api/data/route.ts:7-25) | **1.** `maybeReseedDemo()` is awaited before any read (:12). It runs `demoMeta.updateMany` (an UPDATE on every call, matching 0 rows unless the marker is over 1 h old), then `demoMeta.findUnique` when nothing was claimed (lib/demoReset.ts:37-45).<br>**2.** `loadOwnerData()` runs `room.findMany`, `booking.findMany`, `roomBlock.findMany` + its room relation, and `seasonalPriceRule.findMany` (lib/dataService.ts:11-16).<br>About 6 to 7 statements in total. | 2 sequential, then 4 (or 5) in `Promise.all` | none: no `where`, no `take`, no date range. All bookings ever stored, all blocks, all rules. | room 10, booking 40 (checkIn span 2026-08-23..2026-11-14, 3 cancelled), roomBlock 0, rule 50 · **33,834 bytes (33.8 KB)** (corrected on verification: the first pass said 44.4 KB; `JSON.stringify` of `loadOwnerData()` gives 33,834 bytes, and the local measurement in 3f returned the same 33,834 bytes) |
| same, first call after `lastReset` is over 1 h old | `seedDatabase()` runs inline before the read: 27 sequential `await prisma.*` statements (16 `deleteMany` + 11 creates, lib/seedDatabase.ts:906-1178), no surrounding transaction, then an upsert (demoReset.ts:54-59) | all sequential, on the request path | n/a | rewrites every table |
| GET /api/dining (app/api/dining/route.ts:8-14) | `diningCategory.findMany` with `include: items` = 2 queries | sequential (relation query) | none | 3 categories + 18 items · 9,202 bytes (measured, 3f) |
| GET /api/reservations (app/api/reservations/route.ts:13-18) | `tableReservation.findMany` | 1 | none: no date range, no take | 0 |
| GET /api/hotel (app/api/hotel/route.ts:64-70) | `hotel.findUnique` | 1 | by id | 1 · 679 bytes |
| GET /api/events (app/api/events/route.ts:13-16) | `hotelEvent.findMany` | 1 | none | 3 · 1,892 bytes |
| GET /api/event-requests (app/api/event-requests/route.ts:13-19) | `eventRequest.findMany` with `include: event` = 2 queries | sequential | none | 0 |
| GET /api/contact (app/api/contact/route.ts:15-21) | `contactMessage.findMany` | 1 | `take: 200` (the only owner list with a limit) | 0 |
| GET /api/email-template (app/api/email-template/route.ts:14-27, 45-53) | `emailTemplate.findUnique`, plus `create` when the row is missing (a write on GET) | 1, or 2 sequential | by unique key | 1 · 325 bytes |
| GET /api/media (app/api/media/route.ts:22-28) | no DB (an env check only) | n/a | n/a | n/a |
| GET /api/users?id= (app/api/users/route.ts:34-41) | `user.findUnique` with `include: bookings` = 2 queries | sequential | by id | runs only if a guest session id is in localStorage, via `GuestAuthProvider` inside the owner layout's `Providers` (lib/guestAuth.ts:61-79) |

The "only list with a limit" statement holds for owner-panel lists; repo-wide, the guest `/api/concierge` has `take: 5/4` and a date filter (app/api/concierge/route.ts:62,66-69) (corrected on verification).

Production facts:
- Demo mode is on in production. The live `<html>` carries `data-demo="true"` (GET of https://teakhouse.mikaro.studio/ and /owner); `data-demo` is set from NEXT_PUBLIC_DEMO_MODE (app/layout.tsx:88,101), the same variable `isDemoModeServer()` accepts (demoReset.ts:6-11).
- So the reseed check runs on every `/api/data` call, and the hourly inline reseed lands on whichever owner or guest (`/book`, `/account`) request comes first. A daily cron also exists (vercel.json:2-7).
- Schema indexes: Booking has no index on `checkIn` or `roomSlug` (prisma/schema.prisma:107-133), so `orderBy checkIn` scans and sorts. That is trivial at 40 rows and is only a scaling note.

**Cold full-load sequence (from the code):**
1. Dynamic HTML. Both layouts read `cookies()` (app/layout.tsx:57, 96; app/owner/layout.tsx:12, 23).
2. About 149 KB br of JS loads and hydrates.
3. `setTimeout(0)`, then `/api/data`: 2 sequential DB statements, then 4 in parallel.
4. The spinner is replaced, and only then does the route's `dynamic()` chunk start downloading. In Next 14.2.5, `React.lazy` calls the loader on first render (node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:40, inside BailoutToCSR when ssr is false, :57-62), and the children render only after `hydrated`.
5. Section fetches start, with a second waterfall level on dining and events.

On /owner/dining that is 4 serial network legs counted from React hydration (`/api/data`, the chunk set, 8 chunks in one Promise.all, then `/api/dining`, then reservations, hotel and media); counted from store hydration it is 3 (clarified on verification). Three of those legs are function calls that each reach the database.

### 3b · Middleware
- **What it does per request** (middleware.ts:20-51): clones the request headers, sets `x-pathname` (:22), and rewrites the Cookie header (:27-37) plus sets `tkh-lang` (:41-48) only when `?lang=en|th` is present. No imports besides next/server: no DB, no crypto, no auth.
- **Matcher** (middleware.ts:55): `/((?!api|_next/static|_next/image|favicon.ico|.*\.[\w]+$).*)`.
  - It does not run for `/api/*`, `/_next/static`, `/_next/image`, `favicon.ico` or any path with a file extension (public images, fonts). Nit: the lookahead also excludes any path starting with "api" (for example /apiary).
  - It does run for every page request and every RSC navigation or prefetch request (`/owner/x?_rsc=`, which has no extension; inferred from Next matcher semantics).
- The build reports middleware at 27.1 kB. Per-request cost was not measured separately; with no I/O it is expected to be a few ms (inferred).

### 3c · Client JS
- **Client components:** every owner page, plus OwnerShell, the 13 section and panel components, and components/owner/* (LoginScreen, OwnerField, OwnerMotion, ImageUploadField, InfoTip). Only the layout and the `loading.tsx` files are server components.
- **Heavy imports:**
  - framer-motion: OwnerMotion.tsx:3, used by the dashboard's 4 KPI tiles (DashboardClient.tsx:250-283), and CalendarClient.tsx:10 (`AnimatePresence` at :196).
  - @headlessui/react: BookingsClient, RoomsClient and DiningClient (Dialog, Transition), and ListboxField/OwnerListbox on almost every route.
  - date-fns, plus the `th` locale through lib/dateLocale.ts:1.
  - lucide-react on every route.
  - react-day-picker, reached through DateRangePicker on bookings. Its DayPicker is itself `dynamic()` (components/ui/DateRangePicker.tsx).
  - No chart library: the bars are CSS.
  - `optimizePackageImports` covers lucide, headlessui, date-fns and framer-motion (next.config.mjs:9-16).
- **Splitting:** each page is one `dynamic(ssr:false)` boundary. LoginScreen (OwnerShell.tsx:25-29) and DemoModalPanel are also dynamic.
- **Shared store:** yes, one `/api/data` payload for the whole panel (see 3a).
- **Live production build:** HTML plus chunks fetched with `Accept-Encoding: br`. "raw" means decoded size. Unit note (from verification): totals and per-route dynamic figures are KiB; the per-chunk figures (29.5, 97.8, 39.9, 37.6) are decimal KB.
  - Initial JS on every owner route: 11 module scripts, 148.7 KiB br / 481.5 KiB raw. The `noModule` polyfills are excluded.
  - Within that: react-dom chunk fd9d1056 at 55.1 KB br, next-router 7023 at 32.8 KB br, the **EN+TH i18n dictionary chunk 4768 at 29.5 KB br / 97.8 KB raw** (29,460 / 97,842 bytes; lib/i18n-dict.ts is 106 KB of source, imported by the client `I18nProvider` at lib/i18n.tsx:12), date-fns format plus en-US 4876 at 7.7 KB br, and the ownerStore chunk 57 at 5.6 KB br.
  - Server HTML is 18 to 20 KB (/owner 18,240 B; bookings, dining, settings about 19,900 B). The body before the first script is 1,843 B: the demo bar and a spinner, with no nav and no content.

| Route | dynamic() chunk group adds (br) | Total (br) | Notable chunks in the group |
|---|---|---|---|
| /owner | 48.4 KiB | 197.2 KiB | framer-motion 1846 at 39.9 KB br |
| /owner/bookings | 62.2 KiB | 210.9 KiB | headlessui 4396 at 37.6 KB br, 8180 at 5.9, react-day-picker wrapper 5927 at 4.4 |
| /owner/rooms | 69.1 KiB | 217.8 KiB | headlessui 4396 |
| /owner/dining | 64.3 KiB | 213.1 KiB | headlessui 4396 |
| /owner/events | 73.4 KiB | 222.2 KiB | headlessui 4396 |
| /owner/messages | 54.8 KiB | 203.5 KiB | headlessui 4396 |
| /owner/rates | 56.8 KiB | 205.6 KiB | headlessui 4396 |
| /owner/calendar | 96.0 KiB | 244.7 KiB | framer-motion 1846 + headlessui 4396 |
| /owner/settings | 2.0 KiB | 150.7 KiB | n/a (chunk 4030, 2,043 B) |

The local measurement build (3f) reports First Load JS of 89.9 kB for every owner route; that figure excludes the `next/dynamic` (ssr:false) page clients, which is why headless Chromium received 144 to 234 KB gzip.

Hover prefetch: `NavLink` calls `router.prefetch(href)` on hover, focus and touch (OwnerShell.tsx:121-130), which defaults to a FULL prefetch (node_modules/next/dist/client/components/app-router.js:280-284). Inferred: this warms the RSC payload and the ~1.5 KB page.tsx chunk, but not the `dynamic(ssr:false)` chunk group. The comment at OwnerShell.tsx:121-122 claims the opposite. Not measured.

### 3d · Auth
There is no server-side owner auth and no per-request auth work.
- **The gate is client-only.** `isAuthed` comes from `localStorage["tkh-owner"] === "1"` (lib/ownerStore.ts:34, :181).
- **The PIN is checked in the browser** against `process.env.NEXT_PUBLIC_OWNER_PIN ?? <hardcoded literal>` (ownerStore.ts:205-216). NEXT_PUBLIC_OWNER_PIN is not in the Vercel env (item 1), and live chunk 57 still contains the env expression, so the hardcoded fallback is in effect. A NEXT_PUBLIC_ value is inlined into the client bundle, so the PIN is public by construction (inferred). The value is not reproduced here.
- **Demo mode skips login** entirely (`if (!isAuthed && !demoMode) return <LoginScreen />`, OwnerShell.tsx:179).
- **No cookie, session or DB lookup.** Middleware does no auth. A grep for `headers.get|cookies(|getServerSession|401|403|Unauthorized|Forbidden` over app/api (27 route files) finds only app/api/cron/reseed/route.ts:10-13 (CRON_SECRET bearer) and app/api/users/route.ts:104 (guest sign-in failure). Owner write endpoints such as POST /api/data/reset are unauthenticated.
- **Effect:** auth costs nothing for speed, but it is a correctness and security gap against the directive's "RBAC in both".

### 3e · Measured on production (read-only)

curl from Bangkok, one cold request then 5 warm, at 2026-10-07T03:27Z. "Server" is TTFB minus TLS setup. Only side-effect-free endpoints without guest data were called.

| GET | Cold TTFB ms (server) | Warm median ms (server) | Bytes raw / transfer | x-vercel-id | DB queries (local scan proxy) |
|---|---|---|---|---|---|
| /owner (HTML) | 966 (623) | 477 (340) | 18,240 / 4,598 | sin1::iad1 | 0 |
| /api/hotel | 2906 (2743) | 1180 (1033) | 679 / 444 | sin1::iad1 | 1 |
| /api/dining | 1499 (1358) | 1478 (1344) | 9,202 / 2,947 | sin1::iad1 | 2 (one Prisma call with include) |
| /api/events | 1164 (1029) | 1176 (1030) | 1,892 / 932 | sin1::iad1 | 1 |
| /api/media (no DB) | 429 (288) | 423 (281) | 61 / 63 | sin1::iad1 | 0 |

- Owner HTML TTFB, 6 samples per route on verification: /owner 0.444 to 1.012 s (median about 0.50), /owner/bookings, /owner/dining and /owner/settings 0.434 to 0.485 s (medians about 0.44 to 0.46). The first pass quoted single samples of 1.18, 0.66, 0.50 and 0.56 s; those are not representative, and /owner is not consistently slower (one 1.01 s outlier in 6) (corrected on verification).
- Reconciliation with item 2: a 1-query endpoint costs about 750 to 760 ms more than the no-DB endpoint (1,176 to 1,180 against 423 ms). `/api/dining` is one Prisma call with an `include` (2 statements, 7 flights under `pgbouncer=true`), so it costs about 300 ms more than a single read. A second *separate* Prisma call costs about 780 ms (item 2, pricing route). The first-pass reading "each extra sequential query adds about 300 ms" applies only to an include's second statement (reconciled with item 2).
- Cold and warm were equal on `/api/dining` and `/api/events`, likely because the instance was already warm after the cold `/api/hotel` call (inferred). Item 2's slope analysis indicates warm requests reuse a pooled connection, so this is not evidence of a new connection per request.
- Not called on production: `/api/data` (awaits maybeReseedDemo, a write), `/api/email-template` (GET can create a row), and `/api/contact`, `/api/reservations`, `/api/event-requests` (side-effect free but they return guest data with no auth check, skipped to avoid pulling PII).
- Estimate for production `/api/data`, not measured: at least 3 sequential Prisma round trips (updateMany, findUnique, then the parallel batch), so about 3 × 780 ms plus the ~280 ms no-DB base, or more if the 4 parallel reads serialize on a small pool (the pool size on Vercel is unknown). Once an hour the first caller also waits for 27 sequential reseed statements; at about 780 ms per call that is on the order of 20 s (inferred, not measured).

### 3f · Measured locally

Build: `npx prisma generate && npx next build`, 3m00s. Server: `next start -p 3011` (PID 6552, stopped afterwards) against the dev DB on 55432. Page HTML timings are curl TTFB; the page-load columns come from headless Chromium (Playwright 1.62.1) at 1366x768, 1 cold load and 3 warm loads, each in a fresh context. "JS KB" is gzip transfer of all script requests.

| Owner route | HTML TTFB cold / warm median ms | HTML raw / gzip KB | JS KB shipped (files) | main h1 visible cold / warm ms | APIs called on load |
|---|---|---|---|---|---|
| /owner | 496 / 37 | 17.6 / 5.7 | 187.5 (14) | 1156 / 1091 | /api/data |
| /owner/bookings | 70 / 41 | 19.2 / 5.8 | 201.9 (18) | 1115 / 1000 | /api/data |
| /owner/calendar | 56 / 29 | 19.2 / 5.8 | 234.3 (18) | 1108 / 1071 | /api/data |
| /owner/dining | 77 / 59 | 19.2 / 5.8 | 204.0 (18) | 1024 / 1063 | /api/data, /api/dining, /api/media, /api/reservations, /api/hotel |
| /owner/events | 34 / 61 | 19.2 / 5.8 | 212.6 (20) | 1079 / 1083 | /api/data, /api/events, /api/event-requests |
| /owner/messages | 32 / 54 | 19.2 / 5.8 | 194.9 (17) | 1008 / 1042 | /api/data, /api/contact |
| /owner/rates | 59 / 49 | 19.2 / 5.8 | 196.8 (17) | 1045 / 1024 | /api/data |
| /owner/rooms | 57 / 43 | 19.2 / 5.8 | 208.5 (19) | 1156 / 1043 | /api/data |
| /owner/settings | 68 / 43 | 19.2 / 5.8 | 143.9 (12) | 1103 / 1080 | /api/data, /api/hotel, /api/email-template |

Query counts below come from pg_stat_user_tables scan deltas for one call on the dev DB (a proxy for the number of queries; pg_stat_statements is not loaded locally).

| API (GET), local | Cold first call ms | Warm median ms | JSON bytes (dev seed) | Tables scanned |
|---|---|---|---|---|
| /api/data | 551 (included the hourly demo reseed: DemoMeta.lastReset moved during the call) | 14 | 33,834 (10 rooms, 40 bookings, 50 price rules, no pagination) | 6: DemoMeta 2 (sequential, before the reads), then Room, Booking, RoomBlock, SeasonalPriceRule in Promise.all |
| /api/dining | 12 | 8 | 9,202 | 2 |
| /api/reservations | 11 | 6 | 2 (empty in dev) | 1 |
| /api/hotel | 15 | 6 | 679 | 1 |
| /api/events | 14 | 7 | 1,892 | 1 |
| /api/event-requests | 10 | 5 | 2 | 1 |
| /api/contact | 9 | 5 | 2 | 1 |
| /api/email-template | 12 | 6 | 325 | 1 |
| /api/media | 7 | 4 | 30 | 0 |

**Owner dashboard Lighthouse, local.** Mobile, 3 runs, `http://localhost:3011/owner`, no cookie needed (client-only auth; the shell skips login when NEXT_PUBLIC_DEMO_MODE is true, OwnerShell.tsx:176-179).
- Scores: P 82 (runs 86, 78, 82), A 91, BP 100, SEO 66 (is-crawlable fails, expected for a noindex page). Directive target: Performance, Accessibility and Best Practices ≥95.
- LCP 3,253 ms. The LCP element is the text p.mt-4 in the header, with 1,657 ms render delay. TBT 396 ms, CLS 0.
- JS 192.7 KB. The 7023 chunk accounts for 892 ms of scripting.
- Accessibility fails: aria-prohibited-attr and color-contrast (4 nodes).

**Load timeline for /owner (local, `owner-timeline.cjs`).**
- HTML TTFB 45 ms, DCL 172 ms. 13 scripts finish by 110 ms.
- `/api/data` runs from 282 to 295 ms; the dynamic page chunks load from 307 to 318 ms.
- `main h1` enters the DOM at 578 to 669 ms. Long tasks total 61 to 161 ms.
- 8 RSC prefetches of the other owner routes fire with no interaction, from 399 to 493 ms.

### 3g · Top causes of slow owner loads, ranked, with numbers
1. **The function and the database are far apart (measured; cause inferred).** Functions run in iad1 (all x-vercel-id `sin1::iad1`), the database in Tokyo through the pooler with `pgbouncer=true` (item 2). One Prisma call costs about 780 ms; warm 1-query owner APIs take 1,176 to 1,180 ms on production against 423 ms for the no-DB route, and `/api/dining` 1,478 ms. Every API call from Thailand also pays the sin1 to iad1 hop (about 218 ms, inferred). vercel.json sets no `regions`.
2. **The shell blocks on `/api/data`, which does serial DB work before it reads (code; local measured; production estimated).** OwnerShell renders a spinner until the store hydrates (OwnerShell.tsx:178). `/api/data` runs 2 sequential DemoMeta statements, one an UPDATE, then 4 unbounded reads (route.ts:12, demoReset.ts:37-45, dataService.ts:11-16). Estimated on production at about 3 × 780 ms plus base, and once an hour the first caller waits for the 27-statement reseed (3e). Four routes block on it without using the data.
3. **A client-side chain by design (measured locally).** Even with 4 to 14 ms APIs and 29 to 61 ms warm HTML, content needs about 1.0 to 1.16 s: HTML (a spinner), then 12 to 20 JS files (144 to 234 KB gzip), then hydrate, then `/api/data`, then the ssr:false page chunk, then section fetches, then panel fetches on dining and events.
4. **Every owner page and prefetch is a dynamic iad1 function call (measured).** Both layouts read `cookies()`. Production warm HTML TTFB is about 0.44 to 0.50 s for an HTML that does no DB work. 8 RSC prefetches fire locally with no interaction, and hover triggers FULL prefetches; each is a production function call.
5. **Client JS and CPU on the critical path (measured).** 148.7 KiB br is parsed before the store request starts, including the 29.5 KB br full EN+TH dictionary; the route group adds 2 to 96 KiB br (framer-motion 39.9 KB br on dashboard and calendar; headlessui 37.6 KB br on 7 routes). Dashboard Lighthouse TBT is 396 ms, with 892 ms of scripting in chunk 7023. On the dashboard, 4 `useCountUp` rAF loops (DashboardClient.tsx:29-48, 136-139) re-render the whole page, including the rooms x days `getCell` grid (:506-525; `getCell` is O(bookings) at ownerStore.ts:428-437), for 1.2 s, and the KPI tiles start at opacity 0 under framer-motion (OwnerMotion.tsx:53-56).
6. **Unbounded lists and browser-side analytics (scaling risk, small today).** No `where`, `take` or date range on bookings, blocks, rules, reservations, events or event requests; only contact has `take: 200`. Bookings render with no pagination, twice in the DOM. Analytics are JS loops, not SQL aggregates. At seed size `/api/data` is 33.8 KB for 100 rows (10 rooms, 40 bookings, 50 rules).
7. **Minor items.** `/api/hotel` is fetched separately by Settings and by the Dining panel, with no shared cache (ReservationsPanel uses a plain `fetch`, not `readCached`). Guest providers (GuestAuth, Currency, Concierge) mount inside the owner layout. Middleware is not a cause: no DB, no crypto, and it skips api and assets.

## 4 · Guest calibration

**Setup (measured).** 2026-10-07, 09:43 to 11:10 GMT+7. Windows 10, Intel i7-3632QM (4 cores, 8 threads), Chrome 154 headless, Lighthouse 13.5.0 CLI with default mobile emulation and simulated throttling. The Lighthouse benchmarkIndex over all 125 guest runs (both sites) had a median of 981 (range 753 to 1052).

Machine state at start, from tasklist and a 5 s CPU sample:
- node: only the two dev-DB launchers (PIDs 17860 and 392, 44 MB each).
- Postgres: the two embedded clusters on 55432 and 55433.
- The user's desktop Chrome had 28 processes and 4.3 GB of RAM, but used almost no CPU.
- Loom used about 0.44 of one core continuously (2.2 CPU-seconds in 5 s).
- Total CPU was 5 to 13 percent. There were no heavy build or test jobs.

Raw files: `lh/` (guest Lighthouse JSON), `lh-owner/`, `teak-guest-summary.json`, `psi-web.json`, `ttfb-*.json`.

**Production write safety.**
- `/book` mounts OwnerStoreProvider (`app/(guest)/book/layout.tsx:14`). On load it GETs `/api/data` (`lib/ownerStore.ts:123`), which awaits `maybeReseedDemo()` before reading (`app/api/data/route.ts:12`); maybeReseedDemo writes (updateMany, seedDatabase and upsert, `lib/demoReset.ts:37-59`).
- Every local Lighthouse run blocked `*/api/data*`. The `/book` median run confirms the page asked for `/api/data` and was blocked (status -1).
- `/book` was not run on PSI, because PSI cannot block requests. `/rooms` was used as the third PSI route.
- No other guest route called `/api`, except the Google Maps embed on `/contact` and `/location`.

**Vercel firewall (measured).** After the 60 Teak House Lighthouse loads, curl received the Vercel Security Checkpoint: HTTP 403 with `X-Vercel-Mitigated: challenge` (request id time 03:06:47Z). By 03:27Z curl received 200 again. Every kept Lighthouse run loaded a 200 document. Nothing was bypassed.

### 4a · Calibration table

Local values are medians of 5 runs on the live production URLs. PSI values are medians of 3 runs on pagespeed.web.dev (mobile, Moto G Power, LH 13.5.0). Offset is PSI minus local. LCP, TBT and CLS are medians over the 5 runs. LCP element, JS, fonts and images come from the median-performance run. KB are transfer bytes.

| Route | Local P / A / BP / SEO | Local perf runs | PSI P / A / BP / SEO | Offset P / A / BP / SEO | LCP element | LCP ms (render delay) | TBT ms | CLS | JS KB | Font KB (files) | Image KB (count) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| / | 81 / 96 / 100 / 100 | 70,81,88,80,88 | 98 / 96 / 100 / 100 | +17 / 0 / 0 / 0 | text p.hero-lead-mobile "Twelve teak rooms above the Chao Phraya." | 2977 (2201) | 364 | 0.011 | 254.7 | 41.1 (2) | 261.2 (5) |
| /rooms | 95 / 100 / 100 / 100 | 94,94,95,96,96 | 96 / 100 / 100 / 100 | +1 / 0 / 0 / 0 | img /hero-lcp-640.avif 23.3 KB | 2427 (769) | 151 | 0.001 | 197.7 | 41.1 (2) | 88.5 (5) |
| /rooms/river-loft | 85 / 100 / 96 / 100 | 86,84,83,86,85 | not run | n/a | img /_next/image photo-1631049307264 w=750, 14.4 KB | 2971 (579) | 342 | 0.002 | 226.2 | 41.1 (2) | 93.7 (11) |
| /book (/api/data blocked) | 86 / 100 / 100 / 100 | 86,91,86,89,85 | not run (write risk) | n/a | text p.mt-3 "Two minutes, a small deposit..." | 2901 (1475) | 306 | 0.002 | 231.0 | 41.1 (2) | 0 (0) |
| /dining | 90 / 96 / 100 / 100 | 90,90,90,91,90 | 91 / 96 / 100 / 100 | +1 / 0 / 0 / 0 | img /images/dining/hero-1280.avif 106.1 KB | 2949 (145) | 132 | 0.001 | 197.7 | 41.1 (2) | 321.1 (21) |
| /events | 93 / 96 / 100 / 100 | 94,93,93,93,94 | not run | n/a | img /images/events/hero-1280.avif 52.3 KB | 2604 (830) | 121 | 0.001 | 197.7 | 41.1 (2) | 858.1 (7) |
| /experience | 91 / 100 / 100 / 100 | 91,92,91,89,92 | not run | n/a | img /_next/image photo-1552465011 w=750, 27.3 KB | 2570 (395) | 264 | 0.016 | 245.2 | 41.1 (2) | 120.5 (5) |
| /facilities | 95 / 100 / 100 / 100 | 95,95,97,96,95 | not run | n/a | img lobby-lounge-1280.avif 29.7 KB | 2413 (629) | 133 | 0.001 | 197.8 | 41.1 (2) | 622.9 (7) |
| /gallery | 95 / 100 / 96 / 100 | 94,94,96,95,95 | not run | n/a | img /_next/image photo-1631049307264 w=750, 14.4 KB | 2120 (51) | 157 | 0.081 | 201.9 | 41.1 (2) | 229.1 (14) |
| /offers | 95 / 98 / 100 / 100 | 93,93,95,95,96 | not run | n/a | img /_next/image photo-1552465011 w=750, 27.3 KB | 2403 (710) | 184 | 0.001 | 199.7 | 41.0 (2) | 27.3 (1) |
| /location | 87 / 100 / 100 / 100 | 83,87,87,87,86 | not run | n/a | img /_next/image photo-1552465011 w=750, 27.3 KB | 3308 (666) | 87 | 0.001 | 641.4 | 83.1 (4) | 121.6 (36) |
| /contact | 83 / 100 / 100 / 100 | 81,92,83,92,82 | not run | n/a | img /images/contact-hero.avif 204.3 KB | 3879 (154) | 112 | 0.001 | 626.9 | 41.1 (2) | 239.1 (4) |

PSI runs (run ids in `psi-web.json`):

| Route | Perf runs | A11y | LCP s runs (median) | TBT ms runs (median) | CLS median |
|---|---|---|---|---|---|
| / | 98, 99, 89 | 96 | 1.6, 2.2, 2.5 (2.2) | 0, 10, 340 (10) | 0.011 |
| /dining | 91, 90, 98 | 96 | 3.5, 3.5, 2.3 (3.5) | 10, 20, 10 (10) | 0.007 |
| /rooms | 97, 96, 95 | 100 | 2.6, 2.1, 2.4 (2.4) | 30, 180, 10 (30) | 0.004 |

### 4b · Offset

- Performance offsets are +17, +1 and +1: median +1, mean +6.3. The +17 on `/` comes from TBT: local 364 ms against PSI 10 ms.
- The offset is 0 for Accessibility, Best Practices and SEO on all three routes.
- TBT offsets are -354, -121 and -122 ms. LCP offsets are mixed: -777, -27 and +551 ms.
- Solenne's offsets on the same day are +7, +5 and +14; across both sites (6 routes) the Performance offsets are +1, +1, +5, +7, +14 and +17, median +6. Directive A1 sets the local target at max(97, 95 + offset).
- Local scores under 95 on Performance: 8 of 12 routes (/ 81, /contact 83, /rooms/river-loft 85, /book 86, /location 87, /dining 90, /experience 91, /events 93). Accessibility under 95: none (lowest 96). Best Practices 96 on /rooms/river-loft and /gallery.

### 4c · Guest findings (measured unless marked)
- **TBT.** In every route's median run, the top TBT source is chunk `7023-55d2a397d8ef5d95.js`, with 444 to 890 ms of scripting under 4x CPU slowdown. This chunk is byte-identical to Sovra's (md5 d23cbed1816146e14233f4cb4b397199, 123,729 B raw). It contains Next's AppRouter and hydrateRoot, so it is framework or hydration work rather than app code (inferred). The next sources are react-dom `fd9d1056` and `main-app`. Home also has `1846-447d0a2a6fba2bd0.js` at 296 ms.
- **Text LCP.** On `/` the LCP is text with 2,201 ms element render delay and 282 ms TTFB. On `/book` it is text with 1,475 ms render delay.
- **Fonts.** Every route loads 2 woff2 files, 41.1 KB in total: `5924d7180a413da6-s.p.woff2` (14.2 KB, preloaded) and `636a5ac981f94f8b-s.woff2` (26.9 KB). `/location` adds Roboto from fonts.gstatic.com (42.2 KB) through the Maps embed.
- **Render-blocking CSS.** Every route blocks on `ba3405edf89a8bdf.css` (16 KB) and `5d9c8265a11a8c02.css` (1.4 KB).
- **Maps embed.** `/contact` and `/location` carry about 430 KB of Google Maps embed JS: places.js 90.7, main.js 84.3, init_embed.js 74.8, util.js 70.8 and common.js 37.4 KB.
- **Image weight.**
  - `/events` has 858 KB of images: courtyard-garden-1280.webp 328 KB, string-lights-1280.avif 148 KB and pier-breakfast-1280.webp 147 KB. pavilion-dinner-1280 was downloaded as both .webp (78.9 KB) and .avif (54.8 KB) in the same run.
  - `/facilities` has 623 KB of images. The largest is courtyard-garden-1280.avif at 216 KB.
  - Home pulls one images.unsplash.com photo directly at 149 KB.
- **Best Practices 96.** `/rooms/river-loft` hits a 404 on `/_next/image` for photo-1566665797739 (w=256). `/gallery` hits a 404 for photo-1571008887538 (w=750). Both lead to errors-in-console. (Both ids are among the 11 dead Unsplash photos in item 5.)
- **Accessibility.** color-contrast fails on `/`, `/dining` and `/events`. heading-order fails on `/offers`.
- **Rendering mode.** In the local build every guest route is dynamic (ƒ), except `/rooms/[slug]` (SSG). Source: `build-teak.log`. Directive A1 requires static or ISR guest pages.

### 4d · /dining (93 at the 8/13 baseline)
- Local Performance is 90 in all five runs (90, 90, 90, 91, 90). PSI is 91, 90 and 98, median 91. The 8/13 baseline was 93 (not re-measured here).
- LCP is `/images/dining/hero-1280.avif` (106.1 KB). Median LCP is 2,949 ms. Subparts: TTFB 145, resourceLoadDelay 546, resourceLoadDuration 752, render delay 145 ms. The hero has no preload link (`PageHero.tsx:59-76`, item 5).
- Heaviest requests (KB transfer):

  | Request | KB |
  |---|---|
  | hero-1280.avif | 108.6 |
  | thai-kitchen-1280.avif | 55.8 |
  | fd9d1056 (react-dom) | 55.4 |
  | 4396 chunk | 37.8 |
  | 7023 chunk | 33.0 |
  | 4768 chunk | 29.7 |
  | breakfast-1280.avif | 29.6 |
  | 636a5ac9...woff2 | 27.5 |
  | drinks-1280.avif | 24.7 |
  | ba3405ed...css | 16.4 |

- The page loads 21 images, 321 KB in total. 4 banners at 1280 px make up 213.6 KB. 17 dish thumbnails make up 107.6 KB; they are 256 px AVIF files from 3.9 to 11.3 KB each. (Item 5's headless count found 18 dish thumbs and 22 image requests at 329,010 B; the Lighthouse run counted 21 images. The difference was not resolved.)
- The thumbnails render in a 64 px box (`app/(guest)/dining/page.tsx:147` h-16 w-16, width 128 at :153 and :167, files `-256.avif` at :161). Item 5 Table B computes the saving.
- Total page weight is 592.7 KB.
- /dining is dynamic (`export const revalidate = 0`, `dining/page.tsx:11`). One TTFB sample was 0.69 s against 0.47 s for /rooms (single samples, item 5).

## 5 · Images

Live = branch v17-a.

**Method.** Image references were grepped from `app/ components/ lib/` (owner panel excluded), plus `lib/seedDatabase.ts` for the DB rows. The SSR HTML of 19 live guest pages was fetched with plain GETs (no JS, no `/api`). For two profiles, the variant Chrome would pick was computed with the Blink srcset rule: **M** = 412x823 @1.75 (Lighthouse mobile) and **D** = 1350x940 @1 (Lighthouse desktop). That exact URL was then fetched from production with `Accept: image/avif,image/webp` and its bytes recorded. All 127 static fetches matched the repo files byte for byte, so live `public/` equals v17-a.

**Brightness (recomputed while writing).** Brightness is the true greyscale mean of the 64 px pipeline output (`sharp().resize(64,64,{fit:"inside"}).greyscale().raw()`), with bright ≥140, mid 100 to 139, dark <100. The first pass used `sharp().greyscale().stats()`, which reports the input's channel 0 (red), not the grey (the same trap the Sovra inventory documents). Recomputed over 194 scored files: recorded minus true is -46.8 to +36.9, median +9.2; the verdict changed for 10 of the 74 scored images (dining hero, drinks and reserve, tom yum, facilities pool, and Unsplash 1552465011, 1590490360182, 1540541338287, 1595576508898, 1586023492125). Script and output: `diag/greyall.js`, `diag/greyall.json`. All brightness values below are the recomputed ones.

Unsplash master sizes come from imgix `?fm=json`. Hero and /dining render sizes were measured in headless Chromium on live, with JS off and `/api` blocked. The other render sizes are computed from CSS. Relevance is a visual judgement from contact sheets, scored against the brief "bright contemporary five-star hotel: warm teak, white stone, tropical green, city and river light" (yes / partial / no). Scratch data: served.json, local-inventory.json, unsplash-inventory.json, sheets/.

**Headline findings**
- **11 hotlinked Unsplash photos are dead.** Each returns 404 at images.unsplash.com and at the live `/_next/image`. They fill 16 slots, which show SafeImage's navy gradient after onError (`components/SafeImage.tsx:46-50`):
  - Courtyard Twin: photos 2 to 6 (5 slots)
  - Garden Room: photos 2, 5 and 6
  - River Loft: photos 5 and 6
  - /gallery: "Pool deck loungers" and "Dining table by the window"
  - /book covers (inferred from the seed): Family Annex, Attic Nook and Poolside Hide, plus Poolside Hide photo 2
- **Many images show the wrong place.**
  - The site's river/location photo is a Krabi beach with limestone karsts (`photo-1552465011`). It is the hero of /experience, /location and /offers, the "Evening on the Chao Phraya" section and a gallery tile.
  - The home LCP is a mountain resort pool, but its alt says "at dusk overlooking the Chao Phraya" (`components/hero/HeroLCP.tsx:42`).
  - "Teak house interior" (home) and the /contact hero are the same dark modern residential house exterior (`photo-1600585154340`).
- **The home mobile LCP is badly upscaled.** A 640x427 file fills a 412x823 box, so sharpness is 0.30 (natural px per device px, measured) and only 33% of the width is visible. The /rooms hero reuses that 640 px file: sharpness is 0.56 on M and 0.46 on D.
- **There is no share image.** `og:image` and `twitter:image` are absent on all 19 pages (`app/layout.tsx:73-80` has no images, and there is no `opengraph-image` file).
- **Static images are not cached.** `public/` images are served `cache-control: public, max-age=0, must-revalidate` (127 of 127 fetches), and filenames are not hashed. `/_next/image` responses are served for 1 year.
- **Wasted preloads.**
  - Home preloads `hero-lcp-640.avif` with no media query (`app/(marketing)/page.tsx:14-20`), so desktop downloads it as well as the 1920 file: 23,579 B wasted.
  - `app/(guest)/rooms/layout.tsx:15-21` also applies to `/rooms/[slug]`, so every room page preloads `hero-lcp-640.avif` with `fetchpriority=high` and never shows it (measured in the live HTML).
- **Licence risk.** `house/story` and `house/front-desk` were built from Unsplash+ `premium_photo-*` ids (`scripts/build-facility-images.js:40-41`). The five-star ledger says the site may not use them.
- **Faces in focus.** Two images have a person's face in focus: the spa/massage photo `photo-1544161515` (/experience and /gallery) and `house/housekeeping-team`.
- **Heaviest pages by image bytes** (measured, every image on the page, M / D):
  - /events: 707,143 / 707,143 B. The three DB event cards are plain 1280 px WebP with no AVIF and no srcset (566,328 B; `app/(guest)/events/page.tsx:136-149`).
  - /experience: 246,562 / 734,169 B. ParallaxImage has no `sizes`, so desktop gets w1920 for a box about 566 CSS px wide (`ExperienceClient.tsx:83`, `SafeImage.tsx:73`).
  - Home: 467,906 / 672,389 B, plus 282,622 B of desktop slideshow frames.
  - /dining: 329,010 / 329,010 B.

### Table A · every guest slot
Bytes are M / D, the variant chosen for each profile. "Same" means one variant is served to both. Bright is the recomputed true greyscale mean.

| # | Page · section | Should show | Current file | Bytes M / D | Master | Bright | Relevant | Placeholder | Reuse | Remote |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | / · hero (LCP) | Bright hotel arrival: teak, white stone, pool or river terrace | `public/hero-lcp-{640,828,1920}.avif` (Unsplash 1520250497591, git 6945706) | 23,579 (640) / 204,483 (1920) + 23,579 duplicate preload | 1920x1280 (orig 3456x2304) | 136.6 mid | partial: resort pool under karsts, not city or river | no | yes (/rooms hero, auth panel) | no |
| 2 | / · slideshow frame 2 (desktop, client) | Hotel interior | Unsplash 1611892440504 | n/a / 108,613 (w1920) | 5775x3850 | 66.3 dark | yes (teak bedroom), dark | no | yes (Teak Suite cover, gallery) | yes |
| 3 | / · slideshow frame 3 | Hotel interior | Unsplash 1600585154340 | n/a / 174,009 (w1920) | 4500x3000 | 84.5 dark | no: dark residential exterior | no | yes ×4 | yes |
| 4 | / · About the house | Lobby or lounge, teak + white stone | Unsplash 1600585154340 `?w=1120`, hotlinked, no srcset (`HomeBelowFold.tsx:51`) | 152,225 same | 4500x3000 | 84.5 dark | no (alt says "interior", photo is an exterior) | no | yes | yes |
| 5-7 | / · room cards ×3 | Room covers | Unsplash `?w=640` direct (`HomeRoomCard.tsx:23`): 1631049307264 / 1611892440504 / 1578683010236 | 23,735 / 36,776 / 30,569 same | 6720x4480 / 5775x3850 / 5472x3648 | 150.6 / 66.3 / 110.2 | yes / yes (dark) / no (desert loft) | no | yes | yes |
| 8-14 | / · facilities strip ×7 | As rows 64-70 | `facilities/*-640.avif` picked on M and D | as 64-70 | 1280x960 | as 64-70 | as 64-70 | no | yes (= /facilities grid) | no |
| 15 | / · Beyond: dining card | Restaurant | `facilities/pier-breakfast` | 28,188 same | 1280x960 | 125.3 mid | partial | no | yes ×4 | no |
| 16 | / · Beyond: events card | Event space | `facilities/courtyard-garden` | 63,217 same | 1280x960 | 127.0 mid | partial | no | yes ×4 | no |
| 17 | / · Beyond: facilities card | Pool or spa | `facilities/pool` | 32,210 same | 1280x960 | 109.6 mid | yes | no | yes ×3 | no |
| 18-20 | / and /offers · offer cards ×3 | Offer photography | none: CSS gradients (`OfferCard.tsx:5-22`) | 0 | n/a | n/a | n/a | yes (no photo) | n/a | no |
| 21 | /rooms · hero | Room interior (alt "Teak hotel room interior", `i18n-dict.ts:861`) | `hero-lcp-640.avif` on both (`rooms/page.tsx:29-30`) | 23,579 same | 640x427 | 136.6 mid | no (pool, not a room) | no | yes | no |
| 22-25 | /rooms · cards ×4 | Room covers | next/image: River Loft, Teak Suite, Garden Room, Courtyard Twin covers | 13,600 / 19,977 / 16,914 / 15,627 (w750) · 10,518 / 15,256 / 13,430 / 12,467 (w640) | see Table C | 150.6 / 66.3 / 110.2 / 162.4 | yes / yes / no / no (living room, no beds) | no | yes | yes |
| 26 | /rooms/[slug] · main photo ×4 | Room cover 16:10 | photos[0], q78 | RL 14,476 / 26,281 · TS 21,277 / 37,309 · GR 18,023 / 30,907 · CT 16,608 / 29,012 | Table C | Table C | Table C | no | yes | yes |
| 27 | /rooms/[slug] · thumbs ×5 + 6th in lightbox | Room set | Table C (sizes=120px, q65) | 1.0 to 4.3 KB each; 404s count 79 B | Table C | Table C | Table C | 10 of 24 dead | yes | yes |
| 28 | /rooms/[slug] · other rooms ×3 | Covers | q70 | 11.5 to 17.1 KB (M) / 8.9 to 13.1 KB (D) | n/a | n/a | n/a | no | yes | yes |
| 29 | /book · room cards ×10 (client, DB rooms) | Covers | photos[0] from seedDatabase rooms (DB image columns not read, inferred) | M w750: RL 13,600 · TS 19,977 · GR 16,914 · CT 15,627 · Pier 17,805 · Mango 33,570 · Captain 19,576 · 3 × 404. D w256: 2,956 to 4,877 | Table C | Table C | Table C | 3 dead covers | yes | yes |
| 30 | /book · summary thumb 72x56 + room modal (up to 6) | Room set | photos[] | 96 to 128 px variants | n/a | n/a | n/a | inherits dead | yes | yes |
| 31 | header · rooms mega menu ×4 (desktop, on open) | Covers 72x54 | w96 | 886 / 1,020 / 905 / 949 | n/a | n/a | n/a | no | yes | yes |
| 32 | /dining · hero | Bright dining room with river light, or signature dishes in daylight | `dining/hero-1280.avif`, single variant, no preload link (`PageHero.tsx:59-76`) | 108,271 same | 1280x720 | 136.3 mid | yes (alt says "dark table", the table is tiled) | no | no | no |
| 33-35 | /dining · category strips ×3 (16:7) | Breakfast on the pier / Thai kitchen / drinks | `dining/{breakfast,thai-kitchen,drinks}-1280.avif`, single variant | 29,287 / 55,581 / 24,501 same | 1280x560 | 104.6 / 68.0 / 108.6 | yes / partial (dark slate) / yes | no | breakfast = rice-soup source, drinks = sundowner source (`build-facility-images.js:56,74,61,89`) | no |
| 36-53 | /dining · dish thumbs ×18 | Each dish | Table B | Table B | 256x256 | Table B | yes (subject) | no | 2 pairs (above) | no |
| 54 | /dining/reserve · hero | Table by the river, daylight or golden hour | `dining/reserve-1280.avif` | 48,715 same | 1280x720 | 93.0 dark | partial (rustic candle-lit picnic table) | no | no | no |
| 55 | /events · hero | Bright riverside pavilion or ballroom set for an event | `events/hero-1280.avif` | 53,297 same | 1280x720 | 64.9 dark | partial (night terrace, figure) | no | no | no |
| 56-58 | /events · strip ×3 | Event set-ups | pavilion-dinner / celebration-table / string-lights (640 avif picked) | 22,410 / 21,177 / 43,931 same | 1280x960 | 83.9 / 157.3 / 50.2 | partial / yes / no (dark park party, crowd) | no | pavilion ×3 | no |
| 59-61 | /events · DB event cards ×3 | Loy Krathong / jazz brunch / Songkran | `HotelEvent.image` = `events/pavilion-dinner-1280.webp`, `facilities/pier-breakfast-1280.webp`, `facilities/courtyard-garden-1280.webp` (`seedDatabase.ts:1158,1167,1175`) | 80,468 / 150,262 / 335,598 same (box about 375 CSS on D: 3.4x oversize) | 1280x960 | 83.9 / 125.3 / 127.0 | partial | no | yes, all three | no |
| 62 | /events/reserve · hero | Event space | `events/pavilion-dinner-1280.avif` | 55,842 same | 1280x960 | 83.9 dark | partial | no | yes | no |
| 63 | /facilities · hero | Lobby, bright | `facilities/lobby-lounge-1280.avif` | 30,139 same | 1280x960 | 35.1 dark | no (dark corridor) | no | yes | no |
| 64 | /facilities · pool | Pool | `facilities/pool-640.avif` | 32,210 same | 1280x960 | 109.6 mid | yes | no | yes ×3 | no |
| 65 | /facilities · river pier breakfast | Pier dining | `facilities/pier-breakfast` | 28,188 same | 1280x960 | 125.3 mid | partial (public pier, metal chairs, person from behind) | no | yes ×4 | no |
| 66 | /facilities · courtyard garden | Garden | `facilities/courtyard-garden` | 63,217 same | 1280x960 | 127.0 mid | partial (cluttered) | no | yes ×4 | no |
| 67 | /facilities · lobby lounge | Lounge | `facilities/lobby-lounge` | 11,464 same | 1280x960 | 35.1 dark | no | no | yes ×3 | no |
| 68 | /facilities · airport transfer | Car | `facilities/airport-transfer` | 34,762 same | 1280x960 | 47.9 dark | partial (black sedan, dark) | no | yes ×2 | no |
| 69 | /facilities · housekeeping | Linen | `facilities/housekeeping` | 11,484 same | 1280x960 | 164.3 bright | yes | no | yes ×2 | no |
| 70 | /facilities · luggage storage | Luggage room | `facilities/luggage-storage` | 19,697 same | 1280x960 | 45.1 dark | no (vintage suitcase pile) | no | yes ×2 | no |
| 71 | /experience · hero | River and Charoenkrung in daylight | Unsplash 1552465011 q78 | 27,627 (w750) / 150,144 (w1920) | 4439x3072 | 123.1 mid | no (Krabi beach) | no | yes ×5 | yes |
| 72-75 | /experience · story ×4 (no `sizes`, so 100vw) | Breakfast / pool / spa / evening on the river | 1414235077428 / 1584132967334 / 1544161515 / 1552465011 | 20,210 / 36,348 / 12,380 / 25,745 · 77,756 / 190,210 / 52,293 / 139,514 | 4402x2935 / 3750x2500 / 6000x4000 / 4439x3072 | 117.6 / 110.5 / 171.1 / 123.1 | no (dinner) / partial (seaside) / partial (face in focus) / no | no | yes | yes |
| 76 | /experience · house portrait | Contemporary teak hotel | `house/story-640.avif` | 57,432 same | 1280x1600 | 112.2 mid | partial (traditional Thai house); Unsplash+ licence | no | no | no |
| 77-80 | /experience · team ×4 | Front desk, concierge, housekeeping, kitchen | front-desk / concierge-desk / housekeeping-team / kitchen (640 avif) | 18,577 / 14,514 / 19,862 / 13,867 same | 1280x1280 | 179.7 / 59.0 / 84.8 / 177.1 | yes (Unsplash+ licence) / partial / no (face) / partial (hands) | no | no | no |
| 81 | /gallery · hero | Signature interior | Unsplash 1631049307264 q78 | 14,476 / 74,375 | 6720x4480 | 150.6 | yes | no | yes (River Loft cover) | yes |
| 82-96 | /gallery · 15 tiles (q70, w750 / w640) | Rooms, pool, river, food | 13 live (10.7 to 33.0 KB M) + 2 dead (1571008887538, 1591087917153) | page total 256,646 / 262,547 | 3750 to 6720 wide | see Table C and rows above; "River dusk skyline" = 1508009603885, 71.2 dark, Yaowarat neon, no river | 3 yes / 4 partial / 6 no | 2 dead | 13 of 15 reused | yes |
| 97 | /location · hero | Charoenkrung riverside, Chao Phraya | Unsplash 1552465011 | 27,627 / 150,144 | 4439x3072 | 123.1 | no (alt "Old Bangkok riverside") | no | yes | yes |
| 98 | /offers · hero | Offer mood | Unsplash 1552465011 | 27,627 / 150,144 | 4439x3072 | 123.1 | no | no | yes | yes |
| 99 | /contact · hero | Arrival or concierge, bright | `images/contact-hero.avif`, single 1600 variant | 208,874 same | 1600x1067 | 82.8 dark | no (same photo as 1600585154340, matched by eye) | no | yes | no |
| 100 | /account/signin, /signup · panel | Calm hotel image, portrait | Unsplash 1520250497591 q75 (fallbacks 1584132967334, 1540541338287 on error only) | 39,765 (w750) / 28,859 (w640, sharpness 0.51) | 3456x2304 | 139.8 mid | partial | no | yes | yes |
| 101 | /account · booking thumbs 96 px (client) | Room cover | photos[0] | n/a | n/a | n/a | n/a | inherits dead | yes | yes |
| 102 | all pages · OG share image | 1200x630 brand image | none | 0 | n/a | n/a | n/a | yes (missing) | n/a | n/a |

Hero sharpness, measured on live (natural px per device px; ≥1 is sharp):

| Page | M | D |
|---|---|---|
| / | 0.30 | 1.42 |
| /rooms | 0.56 | 0.46 |
| /dining | 0.84 | 0.93 |
| /dining/reserve | 0.94 | 0.93 |
| /events | 0.92 | 0.93 |
| /events/reserve, /facilities | 1.26 | 0.93 |
| /contact | 1.40 | 1.16 |
| /experience, /location, /offers (computed from served pixels) | 0.68 | 1.39 |

### Table B · /dining dish weight
Measured on live in headless Chromium: 22 image requests, **329,010 B on both M and D**.
- Hero: 108,271 B (33%). It renders at 420x491 CSS on M (sharpness 0.84, 48% of the width visible) and 1377x499 on D (0.93).
- 3 category strips: 109,369 B. Each serves 1280x560 to a box of 364x159 on M (2.01x the width needed) and 804x352 on D (1.59x).
- 18 dish thumbs: 111,370 B. Each serves 256x256 into a 64x64 CSS box, which is 2.29x the width needed on M and 4.00x on D. The `<source>` tags carry no `sizes` or `w` descriptors (`app/(guest)/dining/page.tsx:117-118,161-162`).

| Dish | Served (avif 256) | 128 avif already in repo | Bright |
|---|---|---|---|
| rice-soup | 5,276 | 2,137 | 130.5 |
| crab-omelette | 11,361 | 3,352 | 155.9 |
| fruit-tray | 7,959 | 2,685 | 156.2 |
| coconut-pancakes | 6,388 | 2,314 | 126.6 |
| eggs | 5,125 | 1,979 | 54.0 dark |
| coffee | 3,851 | 1,533 | 157.8 |
| pad-thai | 4,335 | 1,702 | 48.6 dark |
| massaman | 5,829 | 2,313 | 118.9 |
| grilled-fish | 7,033 | 2,462 | 144.3 |
| green-curry | 5,886 | 2,499 | 122.3 |
| pomelo-salad | 9,447 | 3,521 | 155.8 |
| morning-glory | 5,428 | 1,951 | 122.4 |
| tom-yum | 8,014 | 2,660 | 99.3 dark |
| mango-sticky-rice | 6,872 | 2,655 | 153.6 |
| sundowner | 5,250 | 2,098 | 104.5 |
| lemongrass-cooler | 5,027 | 1,908 | 187.5 |
| iced-tea | 3,860 | 1,533 | 38.2 dark |
| beer | 4,429 | 1,506 | 47.4 dark |
| **Total** | **111,370** | **40,808** | |

What is heavy and what the existing files already fix (computed):
- Dish thumbs on a 128w/256w srcset with `sizes=64px`: -70,562 B (-63%). 128 px covers DPR ≤2.
- Category strips with the existing `-640.avif` files on M: 39,980 B instead of 109,369 B (-69,389 B).
- Together that is -140 KB on M, 43% of the page's image bytes. The hero is untouched by this.
- The hero is the only eager image. All 21 others are `loading="lazy"` (`dining/page.tsx:111,125,155,169`), so they add bytes and requests but are not on the LCP path (inferred).
- The HTML is 102,074 B raw / 14,236 B brotli, against 10,823 B brotli for /events. Dish paths appear 108 times (18 dishes × 3 tags × HTML + RSC payload).

### Table C · room photos (lib/rooms.ts and lib/seedDatabase.ts)

Each cell: Unsplash id · master (covers only) · bright · relevant.

| Room (source lines) | 1 (cover) | 2 | 3 | 4 | 5 | 6 (lightbox only) |
|---|---|---|---|---|---|---|
| River Loft (`rooms.ts:63-68`) | 1631049307264 · 6720x4480 · 150.6 · yes | 1618773928121 · 101.9 · partial | 1590490360182 · 93.0 · partial | 1582719478250 · 106.1 · yes | 404 | 404 |
| Teak Suite (`rooms.ts:118-123`) | 1611892440504 · 5775x3850 · 66.3 · yes, dark | 1582719508461 · 126.1 · no (beach deck) | 1540518614846 · 141.9 · partial | 1600566752355 · 113.9 · partial | 1552321554 · 168.5 · no | 1584622650111 · 178.4 · partial |
| Garden Room (`rooms.ts:169-174`) | 1578683010236 · 5472x3648 · 110.2 · no (desert) | 404 | 1584132967334 · 110.5 · no | 1414235077428 · 117.6 · no | 404 | 404 |
| Courtyard Twin (`rooms.ts:221-226`) | 1560448204-e02 · 5472x3648 · 162.4 · no (no beds) | 404 | 404 | 404 | 404 | 404 |
| Pier Studio (DB, `seedDatabase.ts:268-271`) | 1595576508898 · 136.0 · partial | 1505693416388 · 159.2 · no | 1631049552057 · 162.6 · partial | 1566195992011 · 136.1 · partial | n/a | n/a |
| Mango Corner (DB, `:313-315`) | 1616594039964 · 129.2 · partial | 1590490359683 · 117.6 · partial | 1586023492125 · 135.3 · no | n/a | n/a | n/a |
| Captain's Cabin (DB, `:357-359`) | 1618221195710 · 117.7 · no | 1600210492486 · 148.8 · no | 1600607687939 · 149.2 · no | n/a | n/a | n/a |
| Family Annex (DB, `:405-407`) | 404 | 1560448204-603 · 172.0 · no | 1505691723518 · 155.7 · no | n/a | n/a | n/a |
| Attic Nook (DB, `:450-451`) | 404 | 1484101403633 · 173.8 · no | n/a | n/a | n/a | n/a |
| Poolside Hide (DB, `:493-495`) | 404 | 404 | 1578683010236 · 110.2 · no | n/a | n/a | n/a |

The room photos have three problems:
- 42 room photo slots hold only 3 relevant photos ("yes"), and 14 slots are dead.
- The guest pages read 4 rooms from `lib/rooms.ts`, but /book reads 10 rooms from the DB seed. The two lists are separate, so A2 must update both.
- The DB-only rooms are mostly staged apartment living rooms.

DB image columns were not read on production, but item 1 shows every boutique row was rewritten by a reseed at 2026-10-07 01:51 UTC, so production image values equal `lib/seedDatabase.ts` unless edited after that time (inferred).

### Summary counts

**Distinct photographs and brightness (recomputed while writing)**

| Group | Count | Bright / mid / dark | Notes |
|---|---|---|---|
| Local, non-dish | 23 | 4 / 8 / 11 | first pass said 6 / 6 / 11 |
| Dish thumbs | 18 | 7 / 6 / 5 | first pass said 7 / 7 / 4 |
| Unsplash, hotlinked, live | 33 | 14 / 15 / 4 | plus 11 dead (44 ids); first pass said 15 / 13 / 5 |
| **Total distinct** | **83** | | 85 entries minus 2 local copies of Unsplash photos: hero-lcp = 1520250497591 (git 6945706); contact-hero = 1600585154340, by eye |

**Relevance and other flags**
- **Relevance**, over the 56 live non-dish photographs: 10 yes, 25 partial, 21 no. All 18 dish thumbs match their dish.
- **Placeholders:** 16 dead slots, 3 gradient offer cards and the missing OG image.
- **Reuse:** 22 groups. The largest are 1552465011 ×5; hero-lcp ×3 plus the never-shown slide 1; 1600585154340 ×4; pier-breakfast ×4; courtyard-garden ×4; pavilion-dinner ×3.
- **Remote:** 44 Unsplash ids. Two places hotlink images.unsplash.com directly with no optimizer: `HomeBelowFold.tsx:51` and `HomeRoomCard.tsx:23`.

**Five-star branch images** (fad357c, `docs/teak-image-ledger.md`, `scripts/five-star-images.json`; see item 6)
- **What changed:** it adds 330 files under `public/images/fs/`: 45 slugs from 31 distinct Unsplash photos, encoded from w=3200 masters. It deletes 75 v14 files: dining, events, most facilities, house except kitchen, contact-hero avif/webp, and hero-lcp-828/1920. It keeps `facilities/courtyard-garden`, `facilities/housekeeping`, `house/kitchen` and the dish thumbs.
- **Brightness of the set (recomputed while writing):** 18 bright, 19 mid, 8 dark. The dark ones: `dining-hero` 93.9, `gallery-hero` 75.5, `room-teak-suite` 80.7, `room-teak-suite-3` 98.8, `room-garden-room-2` 73.6, `garden` 79.2, `detail-1` 89.1, `fac-transfer` 63.2. (The first pass said 20 / 16 / 9 and listed `hero` at 95.3; its true greyscale mean is 108.0, mid.)
- **Reuse inside the set:** 11 photos fill 2 or 3 slugs each. For example, a river skyline is used as `room-river-loft-2`.
- **What it does not do:** the rooms are still the 4 boutique names (five-star `lib/rooms.ts:47-198`), so there are no five-star categories yet.
- **Relevance (judgement):** visually it is far closer to the brief, with Chao Phraya skylines, bright rooms and bright events. `location-hero` and `river` show Wat Arun, a recognisable landmark but not a property.

### Slot list for the A2 pass (Teak House)
Every slot needs a master ≥3000 px wide. Heroes also need a portrait phone crop: the home box is 412x823, other heroes are about 420x440 to 490.

1. **Heroes (16):**
   - Home LCP, plus 2 desktop slideshow frames (or drop the slideshow)
   - /rooms, /dining, /dining/reserve, /events, /events/reserve, /facilities, /experience, /gallery, /location, /offers, /contact
   - Auth panel (portrait, 45vw by full height)
   - OG image (1200x630, currently missing)
2. **Home (14):**
   - About the house (4:5 desktop, 5:4 mobile)
   - Facilities ×7, shared with /facilities: pool, river pier breakfast, courtyard garden, lobby lounge, airport transfer, housekeeping, luggage
   - Beyond cards ×3 (dining, events, facilities). These should be distinct from the facility frames.
   - Offer cards ×3 (optional; currently gradients)
3. **Rooms, five-star catalogue (5 × 6 = 30):** Deluxe, Premier River View, Junior Suite, Teak Suite, Royal Teak Suite. Each needs:
   - cover (4:3 card, 16:10 detail, 16:9 /book mobile)
   - bed wide, view or balcony, bathroom, living or seating, detail

   Write them to both `lib/rooms.ts` and `lib/seedDatabase.ts`, and retire the 6 DB-only boutique rooms or give them sets too.
4. **Dining (21):** category strips ×3 (16:7: breakfast on the pier, Thai kitchen, drinks) and dish thumbs ×18 (square, 128/256). Recommended (not current): brighten eggs, pad thai, iced tea, beer and tom yum (all under 100).
5. **Events (6):** strip ×3 (4:3) and seeded event cards ×3 (Loy Krathong, Sunday jazz brunch, Songkran). Each card needs its own frame instead of facility reuse.
6. **Experience (9):** story ×4 (breakfast, pool, spa with no face in focus, evening on the Chao Phraya), house portrait ×1 (4:5), team roles ×4 (square, no faces in focus). This also replaces the two Unsplash+ frames.
7. **Gallery (15):** may draw from the set above, but should have no dead or off-location frames.

**Total: 111 slots** (96 if the gallery reuses frames). The highest priority are the 16 dead slots, the 5 Krabi uses, the 2 Unsplash+ frames and the OG image.

## 6 · Five-star branch (`five-star` fad357c vs `main` fa44219)

**Bottom line:** do not merge the branch. Port its architecture onto v17-a in small commits: server chrome, lazy concierge, stay search, picture and preload mechanics, transform-only motion, and the /book skeleton. Drop its visual identity: palette, type, gold buttons, espresso bands, Wordmark variant and OwnerTheme. That identity is a near copy of the rejected v15. The two A4 content items, the five-star room catalogue and the five-star positioning, were never started.

### What the branch is
- One commit: fad357c "wip(five-star): partial redesign, stopped on 10-01, unverified". Its merge-base with main is fa44219.
- `git diff --stat main five-star`: 504 files, +4546 / -5398.
  - 355 added: 330 images under `public/images/fs`, plus 25 code and doc files.
  - 99 deleted: 24 code files and 75 images.
  - 50 modified.
- Every text change sits outside `public/` (99 files). `lib/i18n-dict.ts` is +242 / -20, with 45 new `fs.*` keys in EN and TH only.

### State (measured)
| Check | Result |
|---|---|
| `tsc --noEmit -p .` in a temporary worktree (node_modules junction, worktree removed afterwards) | 0 errors, exit 0. Control worktree of main: 0 errors. |
| `node scripts/th-missing.js` (static gate) | 0 keys need Thai (main: 0) |
| Em-dash in added lines (node scan of the diff) | 0 added (8 removed). The star and check-mark glyphs (U+2605, U+2713) are added too, but main already uses them. |
| Files declared in `lib/fsImages.ts` that exist on disk | 35 sets (9 with a phone crop): 0 missing, 0 orphan slugs |
| Provider hooks reachable outside a provider (import-graph walk over 17 guest routes) | None. /book and /account mount `Providers` in their own layouts; the concierge brings its own (`components/ConciergeBundle.tsx:28-29`). |
| next build, runtime, th-leakage, th-overflow, v11/v13/v14 suites, width sweep, Lighthouse | Not run: no build allowed for this item, and these need a server. **Runtime behaviour is unverified.** |

### Change groups and verdicts
1. **Server chrome**
   - What: `components/header/SiteHeader.tsx` (one server header with CSS dropdowns and a native popover drawer), `HeaderSync`, `CurrencySelect`, server `components/site/SiteFooter.tsx`, static `MobileBookBar`. GuestShell now takes these as slots. `Providers` is removed from `app/(guest)/layout.tsx`, and the concierge loads on click (`ConciergeLazy` / `ConciergeBundle`).
   - Verdict: **keep with changes.**
   - Why: it matches A1 (server by default; islands only for menus, sheets and concierge on click), and it removes the HeaderShell/Header twin the parity law existed to police.
   - Changes needed:
     - The phone menu is a popover only. `globals.css:1108` hides the drawer where popover is unsupported, and the desktop nav shows only from 1200px (`headerStyles.ts` HEADER_NAV). Those browsers get no menu below 1200px.
     - Room prices are now server THB strings (`rooms/[slug]/page.tsx:79`, `rooms/page.tsx:92`, `SiteHeader.tsx:136`), so the header currency picker no longer changes them. On main the room page and mega menu followed currency (main `RoomDetailClient.tsx:36`, `RoomsMegaMenu.tsx:20`).
     - Stale comments still name HeaderShell: `globals.css:144`, `middleware.ts:10-11`, `lib/serverLocale.ts:18`, `docs/five-star-design.md:81-82`.
2. **Stay search** (`components/StaySearch.tsx`, `lib/stayDate.ts`, `lib/staySearchProps.ts`)
   - What: a real GET form to /book.
   - Verdict: **keep with changes.** It is the right base for "booking bar on every page".
   - Changes needed:
     - It appears only on the home hero and the room rail today.
     - The date inputs are invisible (`StaySearch.tsx:88`, opacity-0) over React-state labels. Inferred: with JS off, a changed date is submitted but the label shows the default.
     - Default dates are computed at render (`lib/stayDate.ts:29`). Inferred: they freeze if A1 makes pages static.
     - The date format differs between the search ("Wed, 8 Oct"), the /book trigger ("8 Oct - 9 Oct 2026") and the summary ("EEE d MMM yyyy").
3. **/book flow** (`BookPageClient`, `BookingSummary`, `RoomSelectCard`, `Receipt`, `RoomThumb`, `BookAboveFold`)
   - What: 4 steps become 3.
   - What works: "1 night" is handled (`BookingSummary.tsx:83`, `RoomSelectCard.tsx:91`, `BookPageClient.tsx:466,679`), dates show in words rather than ISO, and the deposit sits on the confirm button.
   - Verdict: **keep with changes.**
   - Changes needed:
     - On phones, two persistent layers show the same total and deposit: the sticky top summary (`BookingSummary.tsx:147`) and the fixed bottom bar (`BookPageClient.tsx:663`). That is the "duplicated sticky elements" bug class A4 audits for.
     - On desktop, Continue and Pay are inline (`BookPageClient.tsx:484,624`), not in the summary. A4 wants one dock with room, nights, total, deposit and Continue.
4. **Visual identity** (`FIVE_STAR_PALETTE` at `config/types.ts:106`, Cormorant/Jost/Trirong, Tailwind radius 12px to 2px and shadows, `.btn-gold` brass gradient at `globals.css:667`, espresso bands)
   - Verdict: **drop.** It is the rejected v15 Eight-Star again (sovra 4b99cd9 `config/presets/eight-star.ts:15-34`), side by side:

     | Token | v15 Eight-Star | Branch |
     |---|---|---|
     | white | #FFFDF9 | #FFFDF9 |
     | cloud | #F6F1E8 | #F7F2EA |
     | navy | #23201B | #2A1E16 |
     | gold | #C8A24E | #C9A46A |
     | line | #E5DCCF | #E2D6C3 |
     | display face | Cormorant Garamond | Cormorant Garamond |

   - It also shares Solenne's register: Solenne uses bone #F3EFE7, champagne #C9B38A and a high-contrast serif (sovra c340018 `src/brand.ts`). The directive requires the two tiers never to look alike.
   - Dark bands work against "bright": events band and closing call on home (`HomeBelowFold.tsx:158,280`), then `StayCta.tsx:10` and the footer (`SiteFooter.tsx:17`) back to back on inner pages.
   - Keep only the mechanics inside globals.css: Thai no-tracking rules, Thai truncate line-height, z-index scale, gallery CSS filters, popover drawer styling.
5. **Wordmark** (`components/Wordmark.tsx`)
   - Verdict: **keep with changes.** It keeps main's LogoMark glyph but adds an eave line (`Wordmark.tsx:42`), thins the stroke from 4 to 1.6 (`:29`) and recolours it brass. Revert to the exact LogoMark glyph to honour "keep the logo".
6. **Motion CSS**
   - Verdict: **keep.** It is transform-only with no hidden resting state, off on phones and under reduced motion (`globals.css` about lines 519-620). It matches A1's "prefer CSS and scroll-driven".
7. **Image pipeline** (`FsPicture`, `ImagePreload` / `HeroPreload`, `lib/fsImages.ts`, `scripts/build-five-star-images.js`)
   - Verdict: **keep with changes.**
   - What works: AVIF plus WebP with explicit dimensions, and media-scoped preloads with a phone crop. The phone hero is 41.7 KB (`hero-m-640.avif`) and 64.3 KB (`hero-m-828.avif`), under the 120 KB target.
   - Changes needed: content-hashed names with an immutable cache (A1; `next.config.mjs` is unchanged), a registry fed by `docs/image-briefs.json`, and the decode-gated unveil (A2).
8. **Image selection** (330 files, 22,652 KB, `docs/teak-image-ledger.md`)
   - Verdict: **candidates only.**
   - Why:
     - 31 Unsplash photos come from 29 photographers, so this is not one shoot.
     - 11 of the 31 photos are encoded under 2 or 3 slots (for example pool, fac-pool and offers-hero).
     - 8 of the 45 slugs are dark (true greyscale, item 5).
     - There is no vision-QA record or contact sheet.
     - The ledger name differs from the directive's `docs/image-ledger.md`.
   - Removing the Unsplash+ `premium_photo` frames: **keep**, for licence reasons.
9. **Copy and meta**
   - Verdict: **keep with changes.** It still says "Boutique Luxury Hotel" (`config/presets/tropical-resort.ts:12`, `lib/routeMeta.ts:23`); A4 wants a five-star hotel. The new keys are EN/TH only.
10. **Room catalogue: not started.** `lib/rooms.ts` and `lib/seedDatabase.ts` only swap photo arrays; it is the same 10 rooms with the same names and rates.
11. **Page rewrites to server components** (experience, gallery, rooms, room detail, offers, location, contact, facilities, dining, events)
    - Verdict: **keep the structure, restyle.** The dining and events reserve pages change only their hero and styling; the server-action forms are untouched.
12. **OwnerTheme** (`components/owner/OwnerTheme.tsx`, `app/owner/layout.tsx`)
    - Verdict: **drop.** It restores palette and fonts only. Owner forms still change, because `components/owner/OwnerField.tsx` imports the restyled ListboxField and DateRangePicker, and base and Thai heading line-heights change too.
    - So the design doc's claim that the panel "looks exactly as it did" (`docs/five-star-design.md:140`) is inaccurate. Inferred; no screenshot taken.
13. **Seed image paths**
    - Verdict: **keep with changes.** Coordinate with the database before any deploy (see below).
14. **`scripts/th-overflow.js`**
    - Verdict: **keep.** Main's limit was the declared header height plus 2 (56/64px header, 58/66px limit); the branch reads `--header-h` and keeps the same rule.

### Deleted files the live site depends on, and their replacements
| Deleted on the branch | Replaced by |
|---|---|
| `Header.tsx`, `header/HeaderShell.tsx`, `header/DeferredHeader.tsx`, `header/RoomsMegaMenu.tsx`, `header/ExperienceMenu.tsx`, `CurrencySwitcher.tsx`, `home/HomeHeaderUpgrade.tsx` | `header/SiteHeader.tsx`, `HeaderSync.tsx`, `CurrencySelect.tsx`, `headerStyles.ts` |
| `Footer.tsx` | `site/SiteFooter.tsx` |
| `DeferredMobileBookBar.tsx` | `MobileBookBar.tsx` (static). Hidden on /book, room pages, auth and /dining (`GuestShell.tsx:28`). /dining's own bar renders only when `reservationsEnabled` (`dining/page.tsx:218-219`). |
| `hero/*` (8 files), `home/HomeDeferredIslands.tsx`, `home/HomeLate.tsx`, `lib/useHeroFabClearance.ts` | `HomeHero` with one photo and no slideshow, plus `StaySearch` and `HeroPreload` |
| `ConciergeFab.tsx` | `ConciergeFabStatic` (existing) plus `ConciergeLazy` / `ConciergeBundle` / `ConciergeAskButton` |
| `PriceChip.tsx`, `RoomDetailClient.tsx` | Server room page. Prices are THB only, so currency switching is lost there. |
| `experience/ExperienceClient.tsx` | Server experience page |
| 75 images (`hero-lcp-1920/828.avif`, `contact-hero.*`, `dining/*`, `events/*`, five facilities sets, `house/*`) | `/images/fs/*` |

- The only code still pointing at old images is the upload fixtures and an owner placeholder, and those files are kept.
- **Database:** the local dev DB (main-seeded) has 1 `HotelEvent.image` row pointing at `/images/facilities/pier-breakfast-1280.webp`, which the branch deletes. Main's seed writes it (main `lib/seedDatabase.ts:1167`). Production was not read for this column; item 1 shows every boutique row was rewritten by a reseed at 2026-10-07 01:51 UTC, so production almost certainly holds the same seeded value (inferred).

### Risks
- **Visual parity law**
  - The header has no hydrated twin, so it holds parity by construction.
  - Remaining divergences:
    - `CurrencySelect` renders "THB" on the server, then switches to the saved currency after mount (`CurrencySelect.tsx:14`).
    - /book applies the `in`, `out`, `g` and `room` URL params only in a useEffect (`BookPageClient.tsx:152-171`; same pattern on main at `:167`). So the server HTML shows default dates, then they change after hydration.
  - The date shell and the picker trigger use identical label format and box classes, so that swap holds parity.
- **No-JS**
  - Better than main: CSS menus, the popover drawer, the GET stay form, the static phone bar, CSS gallery filters, and the reserve server actions intact.
  - Gaps: /book is still a client flow, so no booking completes with JS off (pre-existing). The stay-search labels do not track the chosen dates. No phone menu where popover is unsupported.
- **Thai**
  - th-missing is 0, but th-leakage and th-overflow were not run.
  - The Thai display face changes from Kanit to Trirong, with `adjustFontFallback: false` and `fallback: []` (`app/layout.tsx:52,62`). Inferred: this risks layout shift when the font swaps in, against A1's "fallback metrics, CLS 0".
  - Thai heading line-height rises from 1.2 to 1.42 everywhere, including the owner panel.
- **Lighthouse** (not measured; compare against the previous release on this machine, not an absolute number)
  - Likely gains: no slideshow or hero JS, a zero-hydration header, and no provider tree on 13 of 17 guest routes.
  - Likely cost: main preloads one font (Marcellus). The branch preloads Cormorant 500 normal and italic plus Jost (`app/layout.tsx:31-45`), likely 3 files. The design doc says two (`docs/five-star-design.md:133`).

### What to port into A4 (onto v17-a, one concern per commit)
1. Server header, footer, phone bar and HeaderSync, with a popover fallback.
2. Providers off the guest layout, and the concierge loaded on click.
3. StaySearch on every page; /book reads its params on the server; one dock.
4. FsPicture, ImagePreload and the registry, with hashed names.
5. Transform-only motion and the Thai CSS rules.
6. The th-overflow change.
7. Removal of the Unsplash+ frames.

Everything visual is redone against the A4 brief: bright, warm teak, white stone, tropical green, and the original logo.

## 7 · Engines

Scope: code at `v17-a` (4034872; app code identical to fa44219 and to boutique fe811bc, item 1). Local dev DB :55432 read inside a READ ONLY transaction. No suite was run.

### Feature inventory (v14 base)

| Area | State | Evidence |
| --- | --- | --- |
| /book flow | 4 client steps (dates, room, details, pay) | app/(guest)/book/BookPageClient.tsx:134, 272 |
| Availability on /book | absent: every active room is listed, booked or blocked | BookPageClient.tsx:491; lib/availability.ts is imported only by app/api/concierge/route.ts:4 |
| Last-unit lock | absent: POST /api/bookings creates with no overlap or block check and no transaction; Room has no `units` | app/api/bookings/route.ts:44-56; prisma/schema.prisma Room |
| Server re-pricing | partial: POST re-prices base rate + SeasonalPriceRule with quoteStay, but keeps the client amount when the room is unknown or the quote is 0; no deposit, add-ons or tax | app/api/bookings/route.ts:25-42 |
| Booking write | optimistic: row added in the browser, POST fired, refresh only on failure; the receipt shows before the server answers | lib/ownerStore.ts:238-257; BookPageClient.tsx:316-343 |
| Per-day pricing engine | present (override > season > base, sum of nightly rates) | lib/pricing.ts, byte-identical to sovra/lib/pricing.ts |
| Rate plans | absent: one `rate` plus an `ota` comparison price per room | prisma/schema.prisma:57-58 |
| Promo codes | absent | grep promo/coupon/voucher in app, lib, components: 0 hits |
| Add-ons | absent | no model, no UI (grep addon: only contact "extras") |
| Multi-room | absent: one `roomSlug` state | BookPageClient.tsx:143 |
| OTA channels | absent: `Booking.source` strings (Direct, Agoda, Booking) and the per-room `ota` price used for "save vs OTA" | lib/seedBookings.ts:1; lib/pricing.ts:258-265 |
| Payments | mock: PromptPay is a seeded random QR pattern, card is three unbound inputs, nothing is charged, booking saved `status: "ok"`; no Apple/Google Pay, no wire | BookPageClient.tsx:68, 613-641, 335-336; lib/bookingUtils.ts:3 |
| Deposit | /book hard-codes 30%; owner `Hotel.depositPct` only reaches the email stub | BookPageClient.tsx:226; app/api/bookings/route.ts:95-96 |
| Tax engine (10% SC, 7% VAT) | absent | grep vat / service charge / tax: 0 hits |
| i18n | 2 languages (en, th), cookie `tkh-lang`, 741 dictionary keys as {en, th}; DB copy in paired `*En`/`*Th` columns, no translation table | lib/i18n.tsx:14; middleware.ts:24-25; config/presets/tropical-resort.ts:38; measured key count |
| /rooms data | static SEED_ROOMS (4 rooms), not the DB (10 room types) | app/(guest)/rooms/page.tsx:4, 24 |
| Currencies | 3 (THB, USD, EUR) at fixed demo rates THB/36 and THB/39 | lib/currency.ts:13, 31-36; tropical-resort.ts:37 |
| Guest auth | `User.password` stored and compared as typed; session = user id in localStorage; GET /api/users?id= returns any user | prisma/schema.prisma:149; app/api/users/route.ts:87, 100, 34-41 |
| Owner auth / RBAC | absent server side: client PIN check against `NEXT_PUBLIC_OWNER_PIN` or a hardcoded fallback (value not reproduced) + localStorage flag, skipped in DEMO_MODE; 35 mutating API handlers, none checks the caller | lib/ownerStore.ts:205-214; app/owner/OwnerShell.tsx:179; grep of app/api |
| PII exposure | GET /api/data and GET /api/bookings return every booking (name, phone, email) unauthenticated; /book loads /api/data | app/api/data/route.ts; app/api/bookings/route.ts:14-17; lib/dataService.ts:10-16 |
| Front desk | partial: ok / in / out / cancelled toggle on the bookings list; no today board | app/owner/bookings/BookingsClient.tsx:79, 903-906 |
| Housekeeping | absent | no hkStatus in schema |
| Concierge | present, EN/TH: AI (Anthropic/OpenAI) with live room, dining and event facts, date-intent parsing, deterministic availability reply, prefilled /book link; no quote card, no Reserve | app/api/concierge/route.ts:23-25, 133-160, 215-223; lib/conciergeAvailability.ts:47-53 |
| Price calendar | partial: nightly price under each day (selected room, else cheapest room); no cheapest-night highlight; rules arrive with the whole /api/data payload, not on open | components/ui/DateRangePicker.tsx:283-297; BookPageClient.tsx:248-261 |
| Owner analytics | partial: computed in the browser from all bookings: revenue by month, ADR, occupancy, channel mix, arrivals today | app/owner/DashboardClient.tsx:127-231 |
| Morning brief | absent | |
| Dining / events reservations | present: TableReservation + server action, EventRequest + server action, owner panels | schema:232, 256; app/(guest)/dining/reserve/actions.ts:15; app/(guest)/events/reserve/actions.ts:14 |
| Email | stub until EMAIL_PROVIDER | lib/email.ts:1-7 |
| Demo reset | present: hourly claim-and-reseed inside GET /api/data (blocking), POST /api/data/reset unauthenticated, daily cron 00:00 UTC | lib/demoReset.ts:29-67; app/api/data/route.ts:11-15; app/api/data/reset/route.ts:11; vercel.json |

### B1 items

| B1 item | Teak House today |
| --- | --- |
| Last-unit lock | absent |
| Server re-pricing quote engine | partial (calendar only, client fallback) |
| Rate plans (flexible, non-refundable, breakfast) | absent |
| Promo codes | absent |
| Add-ons (transfers, breakfast, late checkout) | absent |
| Multi-room booking | absent |
| Two-way OTA sync, signed webhooks, 409 | absent |
| PromptPay QR | absent (decorative mock) |
| Card / Apple Pay / Google Pay | absent (mock inputs) |
| Wire | absent |
| Corporate and agent rate codes | absent |
| Thai tax engine, folio and invoice breakdown | absent |
| 16 languages incl. DB content | absent (2 languages, bilingual columns) |
| 13 currencies at live ECB rates | absent (3, fixed) |
| Hashed passwords | absent (raw) |
| RBAC | absent |
| Front-desk view | partial (status toggle) |
| Housekeeping view | absent |
| Price calendar in picker | partial |
| Smart room match | absent (no capacity or preference filter) |
| Concierge quote card with Reserve | partial (text + prefilled link) |
| Owner morning brief with 3 yield suggestions | absent |

### Dormant v15/v16 tables in the production DB

- Repo migrations: 6 (v8 to v14). Local dev :55432 matches them exactly (measured: 6 `_prisma_migrations` rows, 16 app tables).
- Production also carries `20260927090000_v15_eight_star` and `20260928090000_v16_entity_translation` (item 1, read-only, 2026-10-07). Both are additive.
- So the production DB holds, unused by this code: 13 v15 tables (YieldRule, GuestNote, StaffUser, StaffSession, AuditLog, Addon, Payment, Channel, ChannelRoomMap, OutboxEvent, InboundEvent, ServiceRequest, Report), plus EntityTranslation, plus columns on Hotel (timeZone, baseCurrency, promptPayId, bankName, bankAccountName, bankAccountNo, bankSwift), Room (units, hkStatus, hkUpdatedAt), Booking (currency, fxRate, paidAmount, paymentStatus, packages, packagesAmount, channelId, externalRef, checkedInAt, checkedOutAt, vault) and Guest (vip, preferences, language). Source: the v15 migration SQL lines 2-31, 34-227.
- Counts today (item 1): StaffUser 4, Channel 3, Addon 8, YieldRule 3, ServiceRequest 3, Report 1, AuditLog 1, EntityTranslation 1,764; Payment, GuestNote and ChannelRoomMap are 0 because boutique reseeds cascade them away.
- RLS: on 09-29 the 13 v15 tables had RLS off with anon SELECT and INSERT (docs/split-diagnosis.md). Today all 31 public tables have RLS on and 0 anon/authenticated table grants, matching `docs/go-list/teakhouse-rls-hardening.sql` (item 1). The first pass of this item could not determine this; item 1 resolved it.
- The v15 SQL at teakhouse `4b99cd9` and in sovra is identical, and so is the v16 SQL on teakhouse branch `sovra` (40d940d) and in sovra (`diff --strip-trailing-cr`). Restoring both folders under the same names makes local dev match production. Inferred: Prisma tracks migrations by name, so production should see them as already applied (checksums equal the LF file content, item 1), while a freshly generated migration for these tables would fail there on existing objects. Not tested.

### Portable modules for B1 (from sovra; most also exist unchanged in this repo at 4b99cd9)

The comparison of teakhouse `4b99cd9` (v15) against sovra HEAD, ignoring CR, found 0 changed lines in these files: quoteEngine, inventory, yield, addons, createBooking, channels/*, payments/*, auth/password, api, audit, rateLimit, vault, fx, currencies, currency, analytics, conciergeTools, serviceRequests, ai, staffSession, cachedData, the api bookings/staff/account/webhook routes, and the owner DeskClient, ChannelsClient, PackagesClient and ExecutiveClient. Three files differ: session.ts by 3 lines, rbac.ts by 3 and notify.ts by 7, all Solenne additions. The v16 i18n engine is on this repo's `sovra` branch (616752f, 40d940d) with no brand import. Sovra HEAD's i18n-core.ts differs from it by 12 lines (brand tokens).

| Module | Files | Schema needs | Coupling / risk |
| --- | --- | --- | --- |
| Quote engine + inventory + yield | lib/quoteEngine.ts, inventory.ts, yield.ts, pricing.ts (already identical), availability.ts (16 lines drift), app/api/quote, availability, yield, public/rates | Room.units, YieldRule, Addon, Hotel.depositPct | none. Inferred: the picker's day prices use calendar rules only, so they can differ from the quote when yield applies. public/rates needs content/localize |
| Locked booking writer | lib/booking/createBooking.ts, notify.ts, app/api/bookings, bookings/[id], [id]/lifecycle, [id]/identity | Booking v15 columns, Room.units, RoomBlock, OutboxEvent, AuditLog, Guest; needs lib/audit, tenant, vault, channels/outbox | sovra notify.ts imports src/brand and emailHtml (Solenne palette); use the 4b99cd9 copy. Lock is per room slug (createBooking.ts:136). Multi-room would need several locks taken in a fixed order (inferred) |
| Add-ons | lib/addons.ts, app/api/addons/*, app/owner/packages/PackagesClient.tsx, components/booking/AddonPicker.tsx | Addon | AddonPicker: 6 `sv-` classes (sovra), `gold` at 4b99cd9; rebuild in Teak House styling. Seeded add-ons are luxury (helicopter, private chef, nanny); only airport-car and late-checkout fit B1, and there is no breakfast (sovra lib/seedV15.ts:46-123) |
| Channels | lib/channels/inbound.ts, outbox.ts, registry.ts, signing.ts, app/api/channels/** (incl. [id]/webhook, [id]/simulate, sync), app/owner/channels, docs/channel-manager.md | Channel, ChannelRoomMap, OutboxEvent, InboundEvent, Booking.channelId/externalRef, AuditLog | Headers are already `x-tkh-*`. The contract is a generic signed JSON, not native OTA protocols (registry.ts:7-10). Inferred: `reservation.modified` cancels the old booking before creating the new one, so a refused change leaves the original cancelled (inbound.ts:153, 156-188) |
| Payment rails | lib/payments/index.ts, promptpay.ts, stripe.ts, crypto.ts, app/api/payments, payments/webhook/[provider], components/booking/PaymentRails.tsx | Payment, Booking.paidAmount/paymentStatus/currency/fxRate, Hotel.promptPayId and bank fields | npm `qrcode` (PaymentRails dynamic import). Env STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. Without keys a rail runs in demo mode and marks the booking paid (index.ts:17-19). PaymentRails has 6 `sv-` classes. Crypto is outside B1 |
| Auth + RBAC | lib/auth/password.ts, session.ts, rbac.ts, lib/api.ts, audit.ts, rateLimit.ts, staffSession.tsx, app/api/staff, staff/list, account, users (staff-only listing) | StaffUser, StaffSession, AuditLog, existing User (scrypt; a plaintext row is upgraded on next sign-in, password.ts:5-9, 33-37) | Take session and rbac from 4b99cd9 (sovra adds brand.staffDomain and estate sections). DEMO_MODE with no cookie acts as a sandbox owner unless AUTH_ENFORCE=true (session.ts:21-24, 46-48). Env SESSION_SECRET. The rate limit is in memory, per instance (rateLimit.ts:3-9) |
| Front desk + housekeeping | app/owner/desk/DeskClient.tsx, app/api/rooms/[id]/housekeeping, service-requests/*, guests, lib/serviceRequests.ts | Room.hkStatus, ServiceRequest, GuestNote, Guest v15 columns, Booking.checkedInAt/Out | none. The owner-* classes exist in both globals.css files |
| i18n engine (v16) | lib/i18n-core.ts, locales/meta.ts, index.ts, extra.ts + 14 locale files, i18n.tsx, translate.ts, serverLocale.ts, middleware.ts, scripts/locale-coverage.js, locale-render.js, no-emdash.js | none | lib/fonts.ts has 18 `sv-` references (Solenne fonts): rebuild it. Locale strings carry 112 `{brand}` tokens. Measured: 736 of the 741 Teak House keys exist in the sovra DICT, 702 with identical English; the sovra zh locale covers 496 of them (462 with identical English). Note from Solenne item 3: its owner layout serializes the whole dictionary into every owner document (95 KB HTML); do not port that pattern |
| DB content translation | lib/content/localize.ts, sources.ts, translationPipeline.ts, seedTranslations.ts, app/api/content/translate, content/glossary.json, content/style-guides/*, scripts/content-coverage.js, content-gates.js, translate-content.ts | EntityTranslation (+ Addon) | content/source.en.json and translations/*.json hold Solenne content (216 source keys) and cannot be reused. The glossary names Solenne and Sovra once each. Pipeline needs ANTHROPIC_API_KEY. /rooms must read the DB first |
| FX + 13 currencies | lib/fx.ts, currencies.ts, currency.ts, app/api/fx, fx/history, components/CurrencySwitcher.tsx | none | none (Frankfurter/ECB, 1 h cache, fallback table) |
| Analytics + daily report | lib/analytics.ts, app/api/analytics, app/api/reports (cron ?cron=1), app/owner/ExecutiveClient.tsx | Report, Payment, Channel | sovra's analytics route imports src/brand. No pricing suggestions exist yet |
| Concierge tools | lib/conciergeTools.ts, lib/ai.ts (SSE + tools), app/api/concierge, components/ConciergePanel.tsx | ServiceRequest | the concierge route imports src/brand; ConciergePanel has 34 `sv-` classes. Its only tool is create_service_request |
| Dining reservations | lib/reservationService.ts | already present | identical in both repos |

Not portable without a rebuild: sovra's guest booking UI (ReservePageClient.tsx 781 lines, HousePlan, ReservationDock, RoomRow and Receipt all use `sv-` classes), src/brand.ts, lib/emailHtml.ts and lib/fonts.ts.

Exists in neither repo, so it must be built new: rate plans, promo codes, multi-room, corporate/agent rate codes, the tax engine with folio/invoice, smart room match, a concierge quote card with Reserve, the morning brief with yield suggestions, and the cheapest-night highlight.

## Preview safety facts

**Build.** No build step writes to a database in any environment: `package.json:7` is `prisma generate && next build`; there is no postinstall, prebuild, vercel-build script or CI workflow; the Vercel buildCommand is null (item 1).

**Every code path that can write to a DB from a deployed build or request** (all reachable anonymously, on production, on any preview and on the old production deployments; none has server-side auth):
1. GET `/api/cron/reseed`: full reseed; open because CRON_SECRET is unset (`app/api/cron/reseed/route.ts:10-14`, `:21-33`). The Vercel cron is bound to production only, but anyone can call it.
2. GET `/api/data`: `demoMeta.updateMany` on every call and an inline full reseed when DemoMeta.lastReset is over 1 h old (`app/api/data/route.ts:12`, `lib/demoReset.ts:28-60`). Fired on mount by `/book`, `/account` and `/owner` (`lib/ownerStore.ts:122-125,159-167`), so a Lighthouse or PSI run of those pages is a DB write whenever the marker is stale.
3. POST `/api/data/reset`: full reseed, no auth, no DEMO_MODE check (`app/api/data/reset/route.ts:11-13`).
4. GET `/api/email-template`: creates the template row when it is missing (`app/api/email-template/route.ts:14-27`).
5. Owner CRUD: blocks, bookings, contact, dining categories and items, email-template, event-requests, events, hotel, reservations, rooms, room pricing (SeasonalPriceRule), users (item 1 table).
6. Guest writes: POST `/api/bookings`, POST `/api/users` (sign-up, raw password), server actions `contact/actions.ts:49`, dining reserve (`lib/reservationService.ts:35`), events reserve (`lib/eventRequestService.ts:37`).
7. POST `/api/media`: writes to Supabase Storage of the production project from every environment, because SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are one Production+Preview entry.
8. The full reseed itself is not transactional (`lib/seedDatabase.ts:906-1178`, 16 deletes then 11 creates); a timeout or crash between them leaves the site empty (memory note teakhouse-demo-reset-timeout; inferred for this code).
9. Old production deployments 4b99cd9 and 62e316d (v15) are public with production env; their anonymous GET `/api/data` would run the v15 reseed (deleteV15 then seedV15) against the live DB (inferred from code, not exercised).

**Deployment facts.** Git integration has `createDeployments: enabled`, so pushing any branch (including v17-a) creates a preview; the remote also has `feature/v8-system` and `cursor/*`. `ssoProtection` and `passwordProtection` are null. No preview deployment exists yet.

**What must be true before the first preview deploy** (derived from the facts above and directive line 18):
- Preview DATABASE_URL and DIRECT_URL point at a database proven not to be production. Today they are separate Preview entries, but their values are Sensitive and unreadable, so the only way to know is to overwrite them with a known non-production value (inferred).
- Preview storage credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are not the production project's, or preview uploads are disabled.
- The anonymous reseed paths (1, 2, 3) cannot reach production from a preview: either the preview DB is separate (above), or the routes are gated (CRON_SECRET set and the cron route closed when it is unset; reseed and reset gated or DEMO_MODE off on Preview).
- No preview build migrates or seeds: true today for every build (no migrate or seed step exists).
- Measurement does not load `/book`, `/account` or `/owner` on any deployment whose database is production while path 2 is reachable; local Lighthouse blocks `*/api/data*`.
- A decision is recorded on the two old v15 production deployments that remain reachable with production env.

## Open gaps

- Teak House Preview DATABASE_URL and DIRECT_URL values are Vercel Sensitive. Whether they equal production or point elsewhere is unknown; only circumstantial evidence exists (`scripts/restore-rate-rules.js:4-9`, which concerns an older production deployment, and directive line 18).
- Who triggered the production reseed at 2026-10-07 01:51:47Z (local process or production request) is unknown. Vercel request logs return nothing older than about 1 hour, and concurrent measurement traffic (about 5000 GETs in 7 minutes per site) filled the log window.
- When the RLS hardening was applied is unknown: DDL is not timestamped and it is not in `_prisma_migrations`; only its fingerprint shows it was applied.
- The number of reseeds since the last production deploy cannot be counted: pg_stat counters cover the whole period since 2026-07-24.
- Function-to-DB round trip (iad1 to Tokyo) was not measured directly, since nothing was deployed; about 156 ms per flight is inferred from 780 ms per call divided by the 5 flights Prisma 5.22 sends with `pgbouncer=true` (flight count measured locally; assumed unchanged by Supabase's pooler).
- Only warm requests were measured for the per-query cost; cold-start cost and per-request connection setup on a fresh instance were not measured. Connection reuse across warm requests is inferred from the 1-query increment equalling the 1-to-2-query slope.
- Production `/api/data` latency is estimated, not measured (calling it writes). Production owner pages were not loaded in a browser, so production time-to-content is not measured; only HTML and API TTFB by curl.
- The Prisma pool size on Vercel is unknown: the local copy of the production URL has no `connection_limit`, the Vercel value is unreadable, and the function vCPU count is unknown. Whether the 4 "parallel" `/api/data` reads serialize on production is unknown.
- Local owner numbers use the dev DB (round trip about 0 ms) and dev seed data; several lists are empty in dev (reservations, contact, event-requests), so payloads do not reflect production guest volumes. Query counts are a pg_stat scan-delta proxy; per-query timing and order come from code reading.
- Whether hover `router.prefetch` warms the `dynamic(ssr:false)` chunk group is inferred from Next 14.2.5 source, not measured.
- PSI numbers come from the pagespeed.web.dev UI (the keyless PSI API returned HTTP 429); only scores and FCP, LCP, TBT, CLS and SI were read, not PSI's LCP elements or weights. PSI was not run on `/book` (write risk); `/rooms` replaced it.
- Local Lighthouse variance is large on some routes (home 70 to 88) on a 2012-era CPU (benchmarkIndex 753 to 1052), with Loom using about 0.44 of a core throughout. The /dining 93 at the 8/13 baseline was not re-measured.
- Item 5 brightness was recomputed while writing (true greyscale instead of `stats()`); relevance and placeholder verdicts are visual judgements from contact sheets, not metrics. Variant choice is computed with the Blink srcset rule for two Lighthouse-like profiles; real DPR-3 phones pick larger variants. Rendered sizes were measured only for heroes and /dining.
- `contact-hero.{avif,webp,jpg}` has no recorded source id (commit 02167c5 says only "Unsplash stock"); it was matched to photo-1600585154340 by eye. Licence status was checked only by id prefix (`premium_photo`).
- Production image columns (HotelEvent.image, DB-only room photos) were not read; they are inferred to equal the seed because every boutique row was rewritten at 01:51 UTC. `/book` was not loaded in a browser (it calls `/api/data`), so its slot bytes come from fetching the computed `/_next/image` URLs. Item 5's /dining count (22 requests, 18 thumbs) and item 4's Lighthouse count (21 images, 17 thumbs) differ; not resolved.
- Five-star branch runtime is unverified: no build, screenshots, th-leakage, th-overflow, acceptance suites, width sweep or Lighthouse were run on it. The number of preloaded font files (inferred 3) and the owner-panel visual drift are inferred from code; popover browser support is general knowledge, not measured.
- No engine suite or gate was run (most suites write rows). "Proven" for the v15 modules rests on the record in memory teakhouse-v15-resume.md (v15-acceptance 119/119 on 2026-09-27) and commit messages; a static count finds 69 check()/ok() calls in scripts/v15-acceptance.js, and checks inside loops explain the higher recorded total (inferred).
- That `prisma migrate deploy` would treat restored v15/v16 migration folders as already applied is inferred, not tested. Whether the 1,764 EntityTranslation rows still match current boutique entity ids is unknown (the boutique reseed rewrites rooms). The dictionary comparison counts keys and identical English only, not translation quality.
- The inbound `reservation.modified` cancel-before-recreate risk (sovra `lib/channels/inbound.ts:153`, then 156-188) is inferred from reading the code, not reproduced.


## Completeness review (critic pass, 2026-10-07)

An independent pass checked both diagnosis docs against the Phase 0 list. Residual gaps below are known and accepted for Milestone A unless noted; none blocks it.

Files: TH = `D:/WorkSpace/projects/customers/teakhouse/docs/v17-diagnosis.md` (971 lines), SV = `D:/WorkSpace/projects/customers/sovra/docs/v17-diagnosis.md` (840 lines). Directive PHASE 0 = `sovra/docs/directive-v17.md:29-36`.
Legend: `[x]` covered · `[~]` partial · `[ ]` missing.

## 1 · Databases

- [~] **DB per environment (local, preview, production)**
  - TH: local and production are covered. Production is proven to be the live DB by matching pricing ids (TH:29) and by pg_stat_statements deltas (TH:155).
  - TH preview is unknown. The values are Sensitive, so the doc treats preview as production (TH:30, TH:952). The real preview DB is not identified. That gap cannot be closed without overwriting the env value.
  - SV is covered: preview equals production, because the entries target both (SV:28-30). The production host comes from the build log, not from a DB session (SV:828).
- [~] **Every migration since the last production deploy**
  - TH: all 8 rows are listed, and none falls after the deploy (TH:71-84). The RLS hardening is still "applied at an unknown time" (TH:87, TH:954).
  - A lower bound exists that the doc does not use. The SQL was authored in 286dc1c at 2026-09-29T03:00:37Z. TH:898 says RLS was still off on 09-29 (split-diagnosis). So it may have been applied after the fa44219 deploy (2026-09-30 08:18Z). That is not stated.
  - SV: build logs only (SV:80-93). The production DB was never opened. "Estate migration pending" is inferred (SV:93, SV:827).
- [~] **Every seed run since the deploy**
  - TH: one reseed is observed (01:51:47Z) and its origin is unknown (TH:96). The count since the deploy cannot be determined (TH:97, TH:955).
  - SV: no bootstrap seed has run since c340018 (SV:92). Runtime reseeds are not counted (SV:92, SV:827).
- [~] **Each marked additive or not**
  - The migrations are covered: TH:73-82 and SV:95-101.
  - TH's RLS hardening is called "privilege change only" (TH:93) but is never labelled additive or not. Sovra's equivalent is labelled "not purely additive" (SV:100), so the two docs are inconsistent.
  - Runtime reseeds are described as delete-then-rewrite (TH:125-135, SV:107-114). Neither doc labels them non-additive explicitly.
  - SV's estate seed is labelled non-additive (SV:103).
- [~] **Solenne estate, journey and agency tables**
  - SV: the 6 tables are listed, marked additive and pending (SV:101), and the seed rewrite is marked non-additive (SV:103).
  - TH production has none of these tables (TH:103).
  - Missing: SV production presence is not verified. It is inferred only (SV:93).
- [x] **EntityTranslation and the v15 tables present and dormant in the TH DB**
  - Covered at TH:102, TH:107-121 and TH:892-899: row counts, code grep, last writes, and FK cascades (so the tables are not inert).
  - Residual: whether the 1,764 EntityTranslation rows match current entity ids is unknown (TH:969). The old v15 deployments could write to these tables (TH:39, inferred).

## 2 · Regions

- [x] **Function region vs Supabase region, per project**
  - TH: iad1 vs ap-northeast-1 (TH:141-155).
  - SV: sin1 vs ap-southeast-1 (SV:129-146).
- [~] **Measured round trip per query from a function**
  - Per-Prisma-call cost was measured by differencing curl `srv` times on production endpoints that run 0, 1 and 2 queries: TH about 780 ms (TH:173-184), SV about 13 ms (SV:163-174).
  - Missing: an in-function timer (no probe was deployed) and the real function-to-DB network round trip. Both per-flight figures are inferred: TH 156 ms (TH:192, TH:956) and SV 2.5 ms (SV:176, SV:829).
  - SV's signal is below raw TTFB noise (SV:171) and may include concurrent traffic (SV:829).
- [ ] **Cold vs warm per query.** Warm only in both (TH:957, SV:829). Pool size and `connection_limit` are unknown (TH:959, SV:830).

## 3 · Owner panels (both)

- [x] **Per route, every query with count**
  - Covered at TH:228-256 and SV:219-233.
  - Counts come from a pg_stat scan-delta proxy plus code reading, with no Prisma query log (TH:960, SV:833).
  - Inconsistency: SV:408 says /api/analytics "runs 11 queries", but the code has 5 (SV:245). The 11 is the scan proxy (SV:363).
- [x] **Sequential vs parallel.** Covered by code reading in both (TH:228-256, SV:238-240).
- [~] **Rows returned**
  - TH is covered: dev counts equal production for the owner tables (TH:211, TH:101).
  - SV has dev counts only. Production counts are unknown (SV:827).
  - Unreconciled: /owner/estate is "about 28 KB" at SV:229 but measured at 37,610 B at SV:372.
- [~] **Time**
  - Times are per endpoint, not per query.
  - TH production: hotel, dining, events and media only (TH:328-332). /api/data is estimated (TH:338). contact, reservations and event-requests were skipped for PII, and email-template because it writes (TH:337).
  - SV production: staff, analytics, hotel and channels only (SV:326-330). No production timing exists for reports, service-requests, guests, dining, reservations, events, event-requests, contact, addons, yield, email-template or staff/list, and no reason is given except for /api/data.
- [~] **TTFB**
  - TH production HTML covers 4 of 9 routes (TH:334). calendar, events, messages, rates and rooms are missing.
  - SV production HTML covers /owner only (SV:326, SV:332).
  - Local runs cover every route in both (TH:346-354, SV:341-355).
- [x] **Client JS shipped**
  - Covered at TH:294-310 and SV:261-286 plus SV:341-355.
  - SV's static sizes come from a build that predates the commit (inferred identical, SV:193). The 3f fresh build covers v17-a.
- [~] **Middleware work per request**
  - The work is described from code (TH:275-279, SV:253-257).
  - Its per-request cost was not measured in either (TH:279, SV:257).
- [~] **Cold vs warm**
  - Local cold and warm are present in both.
  - On production, "cold" means the first request of a run, not a verified cold start. TH notes the instance was already warm (TH:336). SV has one 951 ms sample (SV:332).
  - Production time-to-content in a browser was not measured (TH:958, SV:836).
- [x] **Top causes with numbers.** TH:382-389 and SV:403-412.

## 4 · Guest calibration (both)

- [~] **PSI API, mobile, 3 runs, median**
  - The pagespeed.web.dev UI was used, because the keyless API returned 429 (TH:962, SV:835).
  - Only 3 routes per site were run. PSI's own LCP elements, TBT sources and weights were not read.
  - No PSI or PAGESPEED variable exists in either repo's .env or .env.local (checked by name only). The doc does not say whether a key was looked for.
- [~] **Local Lighthouse CLI, mobile, 5 runs, median, on live URLs**
  - TH covers 12 of 17 guest pages; SV covers 13 of the 18 c340018 pages.
  - Missing in both: /dining/reserve, /events/reserve, /account, /account/signin and /account/signup.
  - Each site has one room slug. SV's /estate, /journey and /agents are not deployed (SV:451).
- [~] **Idle machine**
  - Loom used about 0.44 of a core and desktop Chrome was open (TH:396-400). benchmarkIndex ranged 753 to 1052.
  - I checked `lh/*.json`: the 125 runs span 02:43:36Z to 03:43:32Z. The TH build started about 03:44:31Z, so no build overlapped the runs.
  - The doc's stated window "09:43 to 11:10 GMT+7" (TH:393) contains both local builds, at 10:44-10:47 and 10:54-10:56. The window should be corrected to the actual runs.
- [x] **Offset**
  - TH:441-445 and SV:462-466, from 3 routes per site.
  - TH's spread is wide (+1 to +17).
- [x] **LCP element.** From local runs only (TH:418-429, SV:437-449).
- [x] **TBT sources.** TH:448 and SV:471.
- [x] **JS per route.** The JS KB column in both tables.
- [~] **Fonts loaded**
  - Files and bytes are listed (TH:450, SV:472), but they are not mapped to family and weight. The A1 "2 families" rule therefore cannot be checked from the doc.
  - Runs used the default locale: `lh-guest.js` sets no lang cookie or header. So Thai and script-font loading was not measured.
- [x] **Image weights.** TH:453-456 and SV:475-478.
- [~] **/dining (93 at the 8/13 baseline)**
  - TH: 90 locally and 91 on PSI, with LCP and weights (TH:461-482).
  - The 93 was not re-measured, and the doc does not say whether it was a PSI or a local score (TH:462, TH:963).
  - SV: covered (SV:484).

## 5 · Images

- [x] **Page, section, what it should show, current file**
  - TH: Table A, 102 rows (TH:522-569), plus Tables B and C.
  - SV: library slots, estate catalogue and rooms (SV:525-659).
- [~] **Brightness**
  - SV is covered. Estate entries inherit the value from their fallback slot.
  - TH has "n/a" on rows 28, 30 and 31. The 15 gallery tiles are not listed one by one (TH:563).
  - The SV hero loop is "inferred mid", because no frames were extracted (SV:583).
- [~] **Resolution**
  - SV is covered (SV:675-676).
  - TH gives the master size for room covers only; photos 2 to 6 have none (TH:621). Gallery tiles are given as a range (TH:563).
- [~] **Relevant yes/no**
  - SV is covered.
  - TH gallery tiles are counted only ("3 yes / 4 partial / 6 no", TH:563).
- [x] **Placeholders and reuse**
  - TH:656-657, and SV:663-670, including the 6 dining venues that share one photo.
  - TH does not say whether it uses blur placeholders. I checked: `git grep` finds no `placeholder="blur"` or `blurDataURL` in app, components or lib at v17-a, so it has none.
- [~] **Data sources**
  - TH did not read production DB image columns, although read-only access exists (TH:641, TH:966).
  - SV production image columns are unknown (SV:827).
  - Owner-side images are not inventoried in either (TH:488, SV:837).

## 6 · Teak House five-star branch

- [x] **What it changed.** TH:697-702 and TH:714-795.
- [~] **Its state**
  - Static checks only: tsc, th-missing, em-dash scan and file existence (TH:704-711).
  - Runtime is unverified: no build, th-leakage, th-overflow, suites, width sweep, Lighthouse or screenshots (TH:712, TH:967). This follows the no-build rule.
- [x] **What survives.** 14 verdicts plus a port list (TH:714-825). SV correctly marks the item N/A (SV:735) and reviews wip/v16-imagery under item 5 (SV:714-731).

## 7 · Engines

- [x] **TH (v14) vs B1.** All 22 B1 points are covered (TH:831-890).
- [x] **SV vs B1.** SV:741-765.
- [~] **SV vs B2** (SV:767-791). Not addressed:
  - "Markup is never visible to the client"
  - Packages "sold on the site and agent portal, editable inside the designer"
  - Guest-profile "dietary notes, celebrations"
  - "Agent demo login lands in a populated dashboard"
  - B3 guided tour (only if it counts as a tier list)
- [~] **Proven v15/v16 modules portable to TH**
  - The list and 0-line diffs are covered (TH:901-923, SV:793-795).
  - "Proven" rests only on a memory record (v15-acceptance 119/119, TH:968), and no suite was re-run.
  - The v16 i18n engine and the DB content-translation pipeline have no proof record cited.

## Cross-cutting

- Neither doc contains an em-dash (grep count 0), and neither contains a URL with a password.
- Both diagnosis docs are untracked (`??` in both repos).
- All 7 Phase 0 boxes are still unticked (`directive-v17.md:186-193` in both repos).

Scratch script used: `C:/Users/MAJID/AppData/Local/Temp/claude/D--WorkSpace-projects-customers-teakhouse/f1305d26-eac0-483c-a4c3-915820181d9c/scratchpad/v17-phase0/critic-lhtimes.cjs`
