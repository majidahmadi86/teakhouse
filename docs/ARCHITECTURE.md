# Teak House v15 · "Eight-Star" architecture

One codebase, two portals, one truth about inventory. This document is the map;
`docs/channel-manager.md` and `docs/security.md` are the two deep dives.

```
                     ┌──────────────── guest experience ────────────────┐
                     │ /  /rooms  /book (2-step)  /account  concierge   │
                     └──────────────┬───────────────────────────────────┘
                                    │ /api/quote · /api/availability · /api/bookings
                                    │ /api/payments · /api/concierge (SSE + tools)
   ┌──────── channels ────────┐     ▼                        ┌──────── staff portals ────────┐
   │ OTA / channel manager    │  lib/quoteEngine  ──────►    │ /owner        executive       │
   │ ◄── signed ARI push      │  lib/inventory    (snapshot) │ /owner/desk   operations      │
   │ ──► signed reservations  │  lib/yield        (demand)   │ /owner/channels · /packages   │
   └───────────┬──────────────┘  lib/pricing      (calendar) └───────────────┬───────────────┘
               │                    │                                        │ RBAC · sessions
               ▼                    ▼                                        ▼
        lib/channels/*   ──►  lib/booking/createBooking  ◄──  /api/bookings/[id]/lifecycle
        (outbox, inbound)     advisory lock · outbox · audit
                                    │
                                    ▼
                         Postgres (Prisma) · one hotelId per property
```

## 1 · The single quote engine

Every price a guest sees or is charged comes from `lib/quoteEngine.ts`:

1. **Calendar** · `lib/pricing.ts` · base rate, seasons, date overrides (unchanged since v11).
2. **Demand** · `lib/yield.ts` · occupancy surge, early-bird / last-minute lead time, minimum stay. Pure, clamped to ×0.6–×2.0.
3. **Packages** · `lib/addons.ts` · per stay / per night / per person.
4. **Display** · `lib/fx.ts` · ECB rates via Frankfurter, cached an hour under the `fx` tag, offline table as fallback. Amounts are always stored in THB with the rate of the day.

`lib/inventory.ts` builds one snapshot per request window (rooms with **units**, overlapping stays, blocks, rules) and answers availability in units, occupancy per night, and the price of any stay. The concierge (`lib/availability.ts`), `/api/quote`, `/api/availability`, the channel push and the booking service all read that snapshot, so they cannot disagree.

## 2 · One way to create a booking

`lib/booking/createBooking.ts` is the only writer. Inside a transaction it takes a per-room-type Postgres advisory lock, recounts the units free for every night from the rows as they are *now*, refuses with `overbooked` if none is left, writes the booking **and** an `OutboxEvent` in the same transaction, then audits. Direct bookings, channel webhooks, the front desk and the concierge all go through it. Two requests racing for the last unit serialise on the lock; the second sees the first's row.

Payment never touches this path: `lib/payments` records `Payment` rows and rolls `paidAmount` / `paymentStatus` forward when a rail settles (webhook, staff confirmation, or demo).

## 3 · Channel manager (`docs/channel-manager.md`)

- **Outbound** · every booking, cancellation, block and rate-rule write enqueues an outbox row; `dispatchOutbox()` turns each row into a signed ARI JSON push per enabled channel (current availability in units + calendar rate for every touched date). Runs after each write with a short budget, and on the daily cron.
- **Inbound** · `POST /api/channels/[id]/webhook` verifies the HMAC + timestamp, deduplicates on `(channel, externalId)`, maps the room, and calls `createBooking`. A sold-out unit answers **409 with alternatives**.
- **Sandbox** · the seeded loopback channel records pushes to the audit log; "Send test reservation" on `/owner/channels` runs a signed event through the real inbound path.

## 4 · Portals and roles (`docs/security.md`)

| Role | Home | Sees |
| --- | --- | --- |
| owner | `/owner` | everything, plus channels, settings, staff |
| manager | `/owner` | executive numbers, content, rates, desk |
| frontdesk | `/owner/desk` | today board, bookings, calendar, messages, guests |
| housekeeping | `/owner/desk` | housekeeping board and the request queue |

Permissions live in `lib/auth/rbac.ts`; every mutating route calls `gate(req, permission)`; the shell hides what a role cannot open and bounces direct URLs. Staff sessions are server rows behind an HttpOnly cookie; guest sessions are signed cookies. In `DEMO_MODE` an anonymous visitor is a sandbox owner and the sidebar role switcher signs in as any seeded role; `AUTH_ENFORCE=true` turns that off.

## 5 · Concierge

`/api/concierge` streams (`stream: true` → SSE frames `delta` / `action` / `done`) and, once a booking code is verified, exposes `create_service_request` as a tool. The model files the request; the desk sees it within 15 seconds on `/owner/desk`. Without a model configured the deterministic path still files requests from intent keywords and still answers dated availability questions from the same snapshot.

## 5b · Sixteen languages, thirteen currencies

`lib/locales/index.ts` lists the guest languages (en, th, zh, ja, ko, ru, de, fr,
es, it, pt, ar, hi, id, vi, ms) with their native names, text direction and
Open Graph tags. English and Thai are authored pairs in `lib/i18n-dict*.ts`;
the other fourteen live in `lib/locales/<code>.ts` and cover every guest key
(`scripts/locale-coverage.js` is the gate). Lookup falls back to English per
key, database copy is EN/TH with English elsewhere, the concierge replies in
the guest's language, Arabic renders right-to-left, and no language costs a
font download (system stacks per script in `globals.css`). The language is a
cookie: `?lang=xx` promotes into it in middleware, a first visit is negotiated
from Accept-Language, and the zero-JS language menu is the same component in
the static header shell and the hydrated header. Currencies: THB base plus
twelve display currencies at live ECB rates (`lib/currencies.ts`, `lib/fx.ts`).

## 6 · Multi-property

Every property table carries `hotelId`. `lib/tenant.ts` resolves the property (`PROPERTY_ID`, or `PROPERTY_HOSTS` for a host-mapped portfolio). Services ask it; nothing else changes.

## 7 · Performance rules that still stand

- Guest routes stay dynamic (locale cookie) but their data is tag-cached (`lib/cachedData.ts`); every owner write calls a `revalidate*` helper.
- No `loading.tsx` on guest routes; SSR shells equal their hydrated replacements (`BookAboveFold` ↔ `BookPageClient` step 1).
- New guest surfaces reserve their height (the plan's preview strip, the packages grid) so CLS stays at zero.
- Static assets and images carry immutable / long cache headers (`next.config.mjs`); `/api/fx` and `/api/public/rates` are CDN-cacheable.

## 8 · Data model additions (v15 migration, additive)

`Room.units/hkStatus` · `Booking.currency/fxRate/paidAmount/paymentStatus/packages/channelId/externalRef/checkedInAt/checkedOutAt/vault` · `Hotel.timeZone/baseCurrency/promptPayId/bank*` · `Guest.vip/preferences` + `GuestNote` · `StaffUser` · `StaffSession` · `AuditLog` · `Addon` · `Payment` · `Channel` · `ChannelRoomMap` · `OutboxEvent` · `InboundEvent` · `ServiceRequest` · `YieldRule` · `Report`.

## 9 · Verification

`node scripts/v15-acceptance.js` (port 3010 by default via `BASE`) covers: role gating, the locked create under concurrency, signed inbound webhooks + dedupe + 409, quote ↔ booking amount agreement, the two-step flow end to end with packages and each payment rail, concierge requests reaching the desk, check-in/out, housekeeping, analytics sanity, security headers, no-JS readability of `/book`, and Thai parity of the new owner routes. The older suites still run; `v11-booking-concierge` now takes its expected total from `/api/quote`.
