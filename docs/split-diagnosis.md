# Split diagnosis · Teak House restore and the Sovra fork

Written 2026-09-29, before any change. Everything below was read, never written,
on production. Every test that writes ran on a local Postgres 17 stand-in.

## 1 · Git

| Fact | Value |
| --- | --- |
| `origin/main` head | `62e316d` v15 gate |
| `4b99cd9` (v15) in `origin/main` | yes |
| `62e316d` (v15 gate) in `origin/main` | yes |
| Last boutique commit (parent of `4b99cd9`) | `fe811bc` "/dining/reserve said closed because a failed read got cached" · 2026-08-13 |
| Unpushed local v16 commits | 8: `54612ee` `616752f` `40d940d` `ddbc1f9` `da5dfca` `bb4427a` `8941009` `ad70fab` |
| Uncommitted Phase 4 work | 60 modified or moved files and 4 new ones (`/reserve`, the house plan, the dock, the reserve-flow gate) |

After Phase A: branch `sovra` = those 8 commits plus `02fe20e` "wip: phase 4
reserve flow, unverified"; local `main` = `origin/main`. After Phase B: `main`
carries `221cf1d` "restore: Teak House boutique (pre-v15)", whose tree hash
equals `fe811bc`'s (`a0d0407`).

## 2 · Database

### Migrations applied to production since `fe811bc`

| Migration | Kind relative to the boutique code |
| --- | --- |
| `20260927090000_v15_eight_star` | Additive. New columns on Hotel, Room, Booking and Guest, all nullable or with defaults. Thirteen new tables. New indexes (the new unique index on Booking is over two nullable columns). New foreign keys only on new columns. No drop, rename or retype. |
| `20260928090000_v16_entity_translation` | Additive. One new table with RLS on and the REST roles revoked. |

The boutique Prisma client simply does not know the new columns and tables.
Every insert it makes still succeeds because each new NOT NULL column has a
default.

### Production data today (read with count and findMany on rooms only)

10 room types (12 units), 40 bookings, 15 guests, 50 price rules, 8 packages,
3 channels, 4 staff users, 37 payments, 1,764 content translations. Postgres
17.6. The demo reset marker is recent (production reseeds hourly from the v15
seed).

### What happens when the boutique code meets this database

Production rows were not copied (that was blocked as personal-data handling
and the snapshot file was deleted). Instead a local stand-in was built the way
production is built: the full migration chain, then the v15 and v16 seed,
which produced the same counts as production.

1. **Before its first reseed** the boutique site renders every route (200 in
   English and Thai). `/book` and the owner panel list the 10 room types from
   the database; `/rooms` lists its 4 static rooms. This split is how the
   boutique version always behaved; the boutique seed also has 10 room types.
2. **The boutique reseed completes on the v15 schema.** In demo mode,
   `GET /api/data` reseeds when the marker is over an hour old, and the daily
   cron reseeds unconditionally. On the stand-in it ran to completion: rooms,
   bookings, guests, price rules, dining and events return to the boutique
   seed. Cascades remove the v15 payments and channel room maps; the other v15
   tables (packages, channels, yield rules, staff users, service requests,
   translations) stay, unused.
3. **Boutique suites on the stand-in after that reseed:** v14 153/153, v11
   36/36 (the boutique v11 has 36 checks), Thai text-fit 156/156, Thai leakage
   0 lines, Thai missing 0 keys.
4. **Read-only pass against production:** a boutique build with demo mode
   compiled off (the reseed path returns before any query) served every guest
   route and `/api/rooms`, `/api/hotel`, `/sitemap.xml` from the production
   database: all 200 in English and Thai, no server errors, 10 rooms returned.
   The owner panel and `/api/data` were not called against production.

**Conclusion:** the boutique code runs clean against the current database. No
compatibility migration is needed. Deploying the restore will make the
boutique demo reset rewrite the demo data within an hour of the first
`/api/data` call (and every night at 00:00 UTC); that is the boutique's
normal behaviour, now written down so it is not a surprise.

### Security findings on production (not changed)

- **Thirteen tables are open to the public REST API.** The v15 tables `Addon`,
  `AuditLog`, `Channel`, `ChannelRoomMap`, `GuestNote`, `InboundEvent`,
  `OutboxEvent`, `Payment`, `Report`, `ServiceRequest`, `StaffSession`,
  `StaffUser`, `YieldRule` have RLS off, and the `anon` role holds SELECT and
  INSERT on them. Anyone with the publishable key can read the staff password
  hashes and session token hashes. The fix is
  `docs/go-list/teakhouse-rls-hardening.sql` (RLS on everywhere, REST roles
  revoked); tested twice on the stand-in, idempotent, no data change.
- **The boutique code publishes every booking.** Its `/book` page loads
  `GET /api/data`, which returns all bookings with guest name, phone and email
  and has no authentication; `POST /api/data/reset` reseeds with no
  authentication. This was live before v15 and returns with the restore.
  Acceptable only while the site holds demo data.

## 3 · Infrastructure

| Item | Finding |
| --- | --- |
| Vercel project | `teakhouse-preview` (team `miomika-s-projects`), Next.js, Node 24 |
| Vercel env names | `DATABASE_URL`, `DIRECT_URL`, `DEMO_MODE`, `NEXT_PUBLIC_DEMO_MODE`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Domains on the account | `mikaro.studio`, `miomika.com`, both on third-party nameservers (a new subdomain needs a DNS record at the registrar) |
| Supabase org plan and project count | Not readable: no Supabase access token on this machine and the CLI is not logged in. A new project therefore could not be created from here. |
| Image-generation keys | None (no Gemini, OpenAI, Replicate) in `.env`, `.env.local`, Vercel env or the user environment |
| Stock image keys | None (no Unsplash or Pexels key) |
| GitHub CLI | Logged in as `majidahmadi86` with `repo` scope |
