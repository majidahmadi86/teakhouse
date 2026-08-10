# Add a room type · Cursor directive

Add one sellable room without breaking booking, owner CRUD, or seed.

## Goal
A new room appears on `/rooms`, `/rooms/[slug]`, `/book`, and owner
Rooms · with live rate from Prisma (single source of truth).

## Steps
1. Choose `slug` (kebab-case), `shortKey`, bilingual `name` / bed /
   view / floor strings. English required. Thai: reuse patterns from
   existing rooms or request Thai from Claude · do not invent Thai.
2. Add the room in `lib/seedDatabase.ts` (canonical seed list) with:
   `rate`, `ota`, `capacity`, `sizeM2`, `amenities`, `photos`, flags
   (`bathtub`, `balcony`, `pets`, `active`).
3. If client static helpers in `lib/rooms.ts` still list rooms for any
   path, mirror the entry there or confirm the path reads from API /
   Prisma only.
4. Run migrate if schema changed (usually not needed for a new row):
   `npx prisma migrate dev` when columns change.
5. Reseed: `npm run db:seed` (demo: prefer reset so bookings stay
   coherent).
6. Owner: confirm create/edit/delete still round-trips via
   `/api/rooms` and survives refresh.
7. Concierge: AI facts pull live rates from Prisma · no hardcoded
   price lists in new code. If `lib/conciergeIntents.ts` still has a
   static price intent, leave it or update carefully · never invent
   rates that disagree with DB.

## Hard rules
- Prices live in the database. Never invent prices in prompts or UI.
- No em-dash. No emojis.
- Do not restyle room cards beyond existing patterns.
- Surgical diffs only · no drive-by refactors.

## Done when
Guest can open the room detail, book it end-to-end (DB write +
receipt), and owner sees the row after refresh.
