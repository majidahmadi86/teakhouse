-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "diningHeroImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "eventsHeroImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "maxPartySize" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "reservationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "serviceEnd" TEXT NOT NULL DEFAULT '22:00',
ADD COLUMN     "serviceStart" TEXT NOT NULL DEFAULT '11:30';

-- CreateTable
CREATE TABLE "TableReservation" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "ref" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "party" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "contactKind" TEXT NOT NULL DEFAULT 'phone',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TableReservation_ref_key" ON "TableReservation"("ref");

-- CreateIndex
CREATE INDEX "TableReservation_date_time_idx" ON "TableReservation"("date", "time");
