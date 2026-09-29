# Go-list · Teak House restore and the Sovra launch

Everything below is prepared and verified locally. Nothing on this list has
been run. Each item is an exact action; run them in order once approved.

## Teak House (teakhouse.mikaro.studio)

1. **Push the restore.** Local `main` is `origin/main` plus two commits:
   `221cf1d restore: Teak House boutique (pre-v15)` (tree identical to
   `fe811bc`) and `286dc1c docs: split diagnosis, restore proof shots, RLS
   hardening`. Vercel `teakhouse-preview` builds `main` automatically.

   ```bash
   git -C D:/WorkSpace/projects/customers/teakhouse push origin main
   ```

   After the deploy, the boutique's demo reseed runs within an hour of the
   first `/api/data` call and nightly from the cron, as it always did.

2. **No compatibility migration.** The v15 and v16 migrations are purely
   additive; the boutique build was verified against a full copy of the
   v15 schema (build, v14 153/153, v11 36/36, Thai fit 156/156, Thai leakage 0).

3. **Security (recommended).** Production has 13 v15 tables with row level
   security off and `anon` grants (staff password hashes, sessions,
   payments). Apply the tested, idempotent hardening script once, in the
   Supabase SQL editor or with psql on `DIRECT_URL`:

   ```bash
   psql "$DIRECT_URL" -f D:/WorkSpace/projects/customers/teakhouse/docs/go-list/teakhouse-rls-hardening.sql
   ```

## Sovra · Solenne (solenne.mikaro.studio)

4. **GitHub.** Create the private repository and push the local history.

   ```bash
   gh repo create majidahmadi86/sovra --private --source D:/WorkSpace/projects/sovra --remote origin --push
   ```

5. **Supabase.** Create a new project named `sovra` (region Singapore,
   `ap-southeast-1`). Copy the pooled (6543, `?pgbouncer=true`) and direct
   (5432) connection strings, then bootstrap and verify from the repo:

   ```bash
   npx prisma migrate deploy && npx prisma db seed && node scripts/verify-rls.js
   ```

   `verify-rls` must print `PASS` (RLS on every table, no `anon` or
   `authenticated` privileges, 10 room types, the content translations).

6. **Vercel project.** New project `sovra` in `miomika-s-projects`, linked to
   the GitHub repository, framework Next.js. Environment variables
   (Production and Preview):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Supabase pooled URL |
   | `DIRECT_URL` | Supabase direct URL |
   | `NEXT_PUBLIC_SITE_URL` | `https://solenne.mikaro.studio` |
   | `DEMO_MODE` / `NEXT_PUBLIC_DEMO_MODE` | `true` |
   | `OWNER_PIN` / `NEXT_PUBLIC_OWNER_PIN` | the demo PIN |
   | `CRON_SECRET` | a new random string |
   | `AI_PROVIDER` and its key | optional · without it The Butler answers from its sixteen-language replies |

7. **Domain.** Add `solenne.mikaro.studio` to the project, then at the
   registrar that hosts `mikaro.studio` add `CNAME solenne → cname.vercel-dns.com`.

   ```bash
   vercel domains add solenne.mikaro.studio
   ```

8. **Production deploy.**

   ```bash
   vercel --prod --cwd D:/WorkSpace/projects/sovra
   ```
