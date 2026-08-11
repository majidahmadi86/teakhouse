# Hotelier

A production-ready direct-booking website and owner dashboard for independent
hotels, built with Next.js 14 (App Router), Prisma, and Tailwind. One config
file re-skins the entire property. Ships with three preset brands, a bilingual
(EN / TH) UI, a booking flow with deposits, a 24/7 AI concierge, and an owner
panel for bookings, rooms, calendar, and settings.

Live demo: https://teakhouse.mikaro.studio

- **Framework:** Next.js 14 App Router, React 18, TypeScript
- **Data:** Prisma ORM · Postgres (Supabase) in production, SQLite for local
- **Styling:** Tailwind CSS, fully theming via CSS variables
- **i18n:** server-resolved locale (cookie), EN / TH out of the box
- **AI concierge:** pluggable provider (Anthropic / OpenAI / Groq)
- **Deploy:** Vercel, one click after env setup

---

## 1. Quickstart (local, 5 minutes)

```bash
# 1 · get the code
unzip hotelier-v1.0.0.zip
cd hotelier-v1.0.0
npm install

# 2 · environment
cp .env.example .env.local
# open .env.local and fill DATABASE_URL + DIRECT_URL (see section 3)

# 3 · database schema + demo data
npx prisma migrate deploy    # Postgres: apply migrations
npx prisma db seed           # load the demo hotel, rooms, bookings

# 4 · run
npm run dev
```

Open http://localhost:3000. The owner panel is at
http://localhost:3000/owner (demo PIN `1234`).

### Fastest local option: SQLite (no Postgres needed)

You can run entirely on a local SQLite file:

1. In `prisma/schema.prisma`, set the datasource to:

   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

   (remove the `directUrl` line · it is Postgres-only)

2. In `.env.local`:

   ```bash
   DATABASE_URL="file:./dev.db"
   ```

3. Create the schema and seed:

   ```bash
   npx prisma db push
   npx prisma db seed
   npm run dev
   ```

Use Postgres (below) for anything you deploy.

---

## 2. Project layout

```
app/                Next.js routes (guest site, /book, /owner dashboard, /api)
components/         UI · hero, header, footer, booking widget, owner panels
config/             Branding and content
  hotel.config.ts   the single re-skin switch (pick one preset)
  presets/          tropical-resort, city-boutique, minimal-zen
  types.ts          config + palette types, TEAK_PALETTE
lib/                i18n, currency, data access, seed data
prisma/             schema.prisma, seed.ts, migrations/
prompts/            copy-paste task recipes (add language, add room, deploy...)
public/             images, favicons, hero art
```

---

## 3. Database setup (Supabase Postgres)

Hotelier uses Prisma with two connection strings: a pooled URL for the running
app and a direct URL for migrations.

1. Create a free project at https://supabase.com.
2. Project settings · Database · Connection string. Copy both:
   - **Transaction / pooled** (port `6543`, host `...pooler.supabase.com`) for
     `DATABASE_URL`. Append `?pgbouncer=true`.
   - **Direct** (port `5432`, host `db.<project>.supabase.co`) for
     `DIRECT_URL`.
3. URL-encode special characters in the password (for example `@` becomes
   `%40`).
4. Put both in `.env.local` (and later in Vercel · see section 4):

   ```bash
   DATABASE_URL="postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres"
   ```

5. Apply schema and seed:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

Any Postgres provider works (Neon, Railway, RDS). Only the two URLs change.

---

## 4. Deploy to Vercel

1. Push this project to a new Git repository (GitHub / GitLab / Bitbucket).
2. Import it at https://vercel.com/new. Framework preset: **Next.js**.
3. Add Environment Variables (Production + Preview) · at minimum:
   - `DATABASE_URL`, `DIRECT_URL`
   - `OWNER_PIN`, `NEXT_PUBLIC_OWNER_PIN`
   - `NEXT_PUBLIC_SITE_URL` (your production URL)
   - `DEMO_MODE`, `NEXT_PUBLIC_DEMO_MODE` (set both to `false` for a real
     property · see section 6)
   - AI keys if you enable the concierge (section 7)
4. Deploy. The build runs `prisma generate && next build`.
5. First deploy only: run migrations against production once, from your
   machine, with the production `DATABASE_URL`/`DIRECT_URL`:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed        # optional · seeds demo content
   ```

There is a full walk-through in `prompts/deploy-vercel.md`.

---

## 5. Re-skin to your hotel (config only)

Everything guest-facing comes from one config object. To launch a different
property you do not touch components.

1. Open `config/hotel.config.ts` and point it at a preset (or your own):

   ```ts
   export { config as hotelConfig } from "./presets/tropical-resort";
   ```

2. Copy a preset in `config/presets/` to `config/presets/my-hotel.ts` and edit:
   - `name`, `nameDisplay`, `tagline`, `siteUrl`
   - `contact` (address, phone, email, LINE, map lat/lng)
   - `palette` (brand colors · drives the CSS variables site-wide)
   - `currencies`, `policies`, `metadata` (SEO title/description)
   - `concierge` name and greeting
3. Point `hotel.config.ts` at your new preset.
4. Room content and rates live in the database · edit them in the owner panel
   (`/owner/rooms`) or change the seed in `lib/seedDatabase.ts` and re-seed.

The three included presets (`tropical-resort`, `city-boutique`, `minimal-zen`)
are complete, working examples of the palette + content shape. Recipe:
`prompts/re-skin.md`.

---

## 6. DEMO_MODE

`DEMO_MODE` / `NEXT_PUBLIC_DEMO_MODE` turn the site into a self-resetting
sandbox:

- a "you are inside a working system" banner and modal appear,
- the owner panel is reachable with the demo PIN,
- data can be reset, and (on Vercel) an hourly cron re-seeds via
  `/api/cron/reseed` guarded by `CRON_SECRET`.

For a **real hotel, set both to `false`.** The demo banner, the reset button,
and the cron reseed all switch off, and the data you enter is permanent.

---

## 7. AI concierge setup

The 24/7 concierge answers guest questions in Thai and English. It is optional
and provider-agnostic. Enable it by setting, in `.env.local` / Vercel:

```bash
AI_PROVIDER=anthropic          # anthropic | openai | groq
ANTHROPIC_API_KEY=sk-...        # the key for the provider you chose
AI_MODEL=claude-...             # optional model override
```

Use `OPENAI_API_KEY` for `openai` or `GROQ_API_KEY` for `groq`. With no key set,
the concierge stays in a safe stubbed mode and the rest of the site runs
normally.

---

## 8. License

This product is sold under a **single-project commercial license**: one buyer,
one hotel/property. You may deploy it for one property, modify it freely, and
keep it running for that property. You may not resell, redistribute, or
sublicense the source code, and you may not use it to build sites for multiple
clients.

Building sites for multiple clients (an agency / reseller use case) requires an
**Agency License**. Pricing and terms: contact us (below). Full terms are in
`LICENSE.txt`.

The included demo content, brand names ("The Teak House" and the sample
presets), and the demo credit are Mikaro Studio's showcase material and are not
part of the license grant · replace them with your own when you launch.

---

## 9. Support

Questions, setup help, or an agency license:

**hello@mikaro.studio**

Include your order number and, for setup issues, your Node version
(`node -v`) and the exact command + error.
