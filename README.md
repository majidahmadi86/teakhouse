# The Teak House · sellable hotel system (v8)

Direct-booking demo hotel: live availability, bilingual concierge,
owner dashboard, Prisma data layer. Showcase system by Mikaro Studio.

## Quickstart

```bash
git clone <repo-url>
cd teakhouse
npm install
cp .env.example .env.local
# set DATABASE_URL (pooled) + DIRECT_URL (direct) from Supabase

npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Owner desk: [http://localhost:3000/owner](http://localhost:3000/owner)
(PIN from `NEXT_PUBLIC_OWNER_PIN`, default `1234`).

## Config guide · hotel presets

Single re-brand switch in `config/hotel.config.ts`:

```ts
export { config as hotelConfig } from "./presets/tropical-resort";
// export { config as hotelConfig } from "./presets/city-boutique";
// export { config as hotelConfig } from "./presets/minimal-zen";
```

Uncomment exactly one preset. Each preset owns name, palette, fonts,
photos, contact, policies, and concierge voice. Guest chrome reads
from `hotelConfig` · do not hardcode brand strings into components.

Cursor prompts for common buyer tasks live in `/prompts`:
- `re-skin.md`
- `add-room-type.md`
- `add-language.md`
- `deploy-vercel.md`

## Demo mode

Set both (or at least the public flag for the UI bar):

```
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```

When on:
- Guest ⇄ Owner switcher bar appears
- Owner PIN gate is bypassed for demos
- Hourly reseed via `/api/cron/reseed` (Vercel cron + `CRON_SECRET`)
- In-app reset path reseeds when last reset is older than 60 minutes

Leave both `false` for a sticky client database.

## Provider setup

### Database · Postgres (Supabase)

Default in `prisma/schema.prisma`:

```
provider  = "postgresql"
url       = env("DATABASE_URL")   # pooled · port 6543
directUrl = env("DIRECT_URL")     # direct · port 5432 · migrations
```

URL-encode special characters in the password (`@` → `%40`).

Local SQLite swap (optional):

1. Set `provider = "sqlite"` and remove `directUrl`
2. `DATABASE_URL="file:./dev.db"`
3. `npx prisma migrate dev` then seed

### AI concierge

Optional. Without keys, the chat panel uses local intent matching.

```
AI_PROVIDER=anthropic   # or openai | groq
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
# AI_MODEL=               # optional override
```

Route: `POST /api/concierge` with `{ message, lang }`. Facts come from
`hotel.config` plus live room rates from Prisma · the model must not
invent prices. 6s timeout returns the configured fallback message.

### Email stub

```
EMAIL_PROVIDER=stub
EMAIL_API_KEY=
EMAIL_FROM=stay@example.com
```

`lib/email.ts` logs confirmation payloads until a real provider is
wired. Safe for demos.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Seed rooms, bookings, templates |
| `npm run db:reset` | Migrate reset + seed |
| `npm run presets:shots` | Screenshot preset sweep |

## License

Copyright © Mikaro Studio. All rights reserved.

This repository is provided as a demonstration system for licensed
clients. Redistribution, resale, or production use outside an active
Mikaro agreement requires written permission. Contact
stay@teakhouse.demo (placeholder) for licensing.
