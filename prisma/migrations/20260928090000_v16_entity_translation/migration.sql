-- CreateTable
CREATE TABLE "EntityTranslation" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'machine',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityTranslation_locale_entityType_idx" ON "EntityTranslation"("locale", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "EntityTranslation_entityType_entityId_field_locale_key" ON "EntityTranslation"("entityType", "entityId", "field", "locale");


-- v16 · Row-level security · no anonymous access. The application connects as the
-- table owner (bypasses RLS); Supabase's anon/authenticated roles get nothing.
ALTER TABLE "EntityTranslation" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "EntityTranslation" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "EntityTranslation" FROM authenticated;
  END IF;
END $$;
