-- AlterTable
ALTER TABLE "SeasonalPriceRule" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'season',
ADD COLUMN     "price" INTEGER,
ALTER COLUMN "multiplier" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "SeasonalPriceRule_roomId_startDate_endDate_idx" ON "SeasonalPriceRule"("roomId", "startDate", "endDate");

