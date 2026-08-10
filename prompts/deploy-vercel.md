# Deploy to Vercel · Cursor directive

Ship the sellable demo. Do not merge to `main` unless Mike confirms.
Do not deploy from this agent unless explicitly asked.

## Goal
A Vercel project running this Next.js app with Postgres (recommended
for production), env vars set, Prisma migrated, seed applied once,
cron reseed optional for DEMO_MODE.

## Steps
1. Push the feature branch (e.g. `feature/v8-system`). Do not force-push
   protected branches.
2. Vercel → Import repo → set Root Directory if needed → Framework
   Next.js.
3. Database:
   - Local default is SQLite (`DATABASE_URL=file:./dev.db`).
   - Production: in `prisma/schema.prisma` set
     `provider = "postgresql"`, then set
     `DATABASE_URL` to the Vercel Postgres / Supabase / Neon URL
     (`?sslmode=require` as needed).
4. Build command: keep `prisma generate && next build` (see
   `package.json` `build` script). Add a release step for migrate:
   `npx prisma migrate deploy` (CI or Vercel build command prefix).
5. Env vars (Production + Preview as appropriate):
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SITE_URL` (canonical https URL)
   - `OWNER_PIN` / `NEXT_PUBLIC_OWNER_PIN`
   - `DEMO_MODE` / `NEXT_PUBLIC_DEMO_MODE` (`true` for sandbox demos)
   - `CRON_SECRET` (Bearer for `/api/cron/reseed`)
   - AI: `AI_PROVIDER` + `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` or
     `GROQ_API_KEY` (optional `AI_MODEL`)
   - Email stub: `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`
6. Seed once after first migrate: `npx prisma db seed` via Vercel CLI
   or a one-off job. For DEMO_MODE, daily cron hits
   `/api/cron/reseed` (see `vercel.json`; Hobby = daily max).
   Primary reseed is still on API access when last reset > 60 min.
7. Verify: `/` loads, `/book` writes a booking, owner PIN (or demo
   bypass) works, concierge returns 503→local intents or AI reply.

## Hard rules
- NO merge to main without Mike.
- NO deploy from the agent unless the user explicitly requests it.
- No em-dash in copy. No emojis.
- Never commit `.env` / secrets.

## Done when
Production URL serves the guest site, DB persists bookings across
refresh, and demo cron (if enabled) reseeds without auth failures.
