-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "bankAccountName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bankAccountNo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bankName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "bankSwift" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "baseCurrency" TEXT NOT NULL DEFAULT 'THB',
ADD COLUMN     "promptPayId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'Asia/Bangkok';

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "hkStatus" TEXT NOT NULL DEFAULT 'clean',
ADD COLUMN     "hkUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "units" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "channelId" TEXT,
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'THB',
ADD COLUMN     "externalRef" TEXT,
ADD COLUMN     "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "packages" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "packagesAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paidAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
ADD COLUMN     "vault" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "preferences" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vip" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "YieldRule" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "roomId" TEXT,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxLeadDays" INTEGER,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "minNights" INTEGER NOT NULL DEFAULT 1,
    "startDate" TEXT,
    "endDate" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YieldRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestNote" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT 'note',
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'frontdesk',
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "actorId" TEXT,
    "actorRole" TEXT NOT NULL DEFAULT 'system',
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL DEFAULT '',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "key" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "descriptionTh" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'experience',
    "price" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'stay',
    "image" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "chargedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "providerRef" TEXT NOT NULL DEFAULT '',
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "endpoint" TEXT NOT NULL DEFAULT '',
    "secretEnc" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL DEFAULT 'both',
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelRoomMap" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "externalRoomId" TEXT NOT NULL,
    "externalRateId" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ChannelRoomMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundEvent" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processed',
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "bookingId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'other',
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "due" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'guest',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL DEFAULT 'default',
    "kind" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YieldRule_hotelId_enabled_idx" ON "YieldRule"("hotelId", "enabled");

-- CreateIndex
CREATE INDEX "GuestNote_guestId_createdAt_idx" ON "GuestNote"("guestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_tokenHash_key" ON "StaffSession"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffSession_staffId_idx" ON "StaffSession"("staffId");

-- CreateIndex
CREATE INDEX "AuditLog_hotelId_createdAt_idx" ON "AuditLog"("hotelId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Addon_key_key" ON "Addon"("key");

-- CreateIndex
CREATE INDEX "Addon_hotelId_order_idx" ON "Addon"("hotelId", "order");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_provider_providerRef_idx" ON "Payment"("provider", "providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelRoomMap_channelId_roomId_key" ON "ChannelRoomMap"("channelId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_key_key" ON "OutboxEvent"("key");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "InboundEvent_createdAt_idx" ON "InboundEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InboundEvent_channelId_externalId_key" ON "InboundEvent"("channelId", "externalId");

-- CreateIndex
CREATE INDEX "ServiceRequest_hotelId_status_createdAt_idx" ON "ServiceRequest"("hotelId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_hotelId_createdAt_idx" ON "Report"("hotelId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_checkIn_checkOut_idx" ON "Booking"("checkIn", "checkOut");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_channelId_externalRef_key" ON "Booking"("channelId", "externalRef");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelRoomMap" ADD CONSTRAINT "ChannelRoomMap_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelRoomMap" ADD CONSTRAINT "ChannelRoomMap_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundEvent" ADD CONSTRAINT "InboundEvent_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

