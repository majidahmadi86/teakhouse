-- CreateTable
CREATE TABLE "DiningCategory" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "nameEn" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionTh" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelEvent" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "titleEn" TEXT NOT NULL,
    "titleTh" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionTh" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiningItem_categoryId_order_idx" ON "DiningItem"("categoryId", "order");

-- CreateIndex
CREATE INDEX "HotelEvent_date_idx" ON "HotelEvent"("date");

-- AddForeignKey
ALTER TABLE "DiningItem" ADD CONSTRAINT "DiningItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DiningCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
