-- Teak House production · RLS hardening · NOT APPLIED. Run only on Mike's go.
--
-- Why: the v15 migration created thirteen tables with row-level security
-- off, and Supabase grants every public table to the anon and authenticated
-- roles. Those tables (StaffUser password hashes, StaffSession token hashes,
-- Payment, GuestNote, AuditLog and more) are therefore readable and writable
-- through the Supabase REST API by anyone holding the publishable key.
--
-- What it does: switches RLS on for every public table (no policies, so the
-- REST roles see nothing) and revokes the REST roles' grants. The app talks
-- to Postgres through Prisma as the table owner, which RLS does not restrict,
-- and storage uses the service role, so the site keeps working unchanged.
-- Idempotent · additive · no data is changed.

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
  END IF;
END $$;
