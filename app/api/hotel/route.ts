import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { gate, isDenied, readJson } from "@/lib/api";
import type { HotelDto } from "@/lib/ownerTypes";
import { revalidateHotel } from "@/lib/revalidate";
import { isVaultEnabled } from "@/lib/vault";

export const dynamic = "force-dynamic";

const HOTEL_ID = "default";

type Row = NonNullable<Awaited<ReturnType<typeof prisma.hotel.findUnique>>>;

function toDto(row: Row): HotelDto {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    email: row.email,
    phone: row.phone,
    lineId: row.lineId,
    address: row.address,
    addressLine: row.addressLine,
    city: row.city,
    country: row.country,
    postalCode: row.postalCode,
    lat: row.lat,
    lng: row.lng,
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    cancelPolicy: row.cancelPolicy,
    petsPolicy: row.petsPolicy,
    depositPct: row.depositPct,
    reservationsEnabled: row.reservationsEnabled,
    serviceStart: row.serviceStart,
    serviceEnd: row.serviceEnd,
    maxPartySize: row.maxPartySize,
    diningHeroImage: row.diningHeroImage,
    eventsHeroImage: row.eventsHeroImage,
    timeZone: row.timeZone,
    baseCurrency: row.baseCurrency,
    promptPayId: row.promptPayId,
    bankName: row.bankName,
    bankAccountName: row.bankAccountName,
    bankAccountNo: row.bankAccountNo,
    bankSwift: row.bankSwift,
    vaultEnabled: isVaultEnabled(),
  };
}

export async function GET() {
  const row = await prisma.hotel.findUnique({ where: { id: HOTEL_ID } });
  if (!row) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  return NextResponse.json(toDto(row));
}

const str = (v: unknown, fallback: string, max = 300) =>
  typeof v === "string" ? v.trim().slice(0, max) : fallback;

export async function PATCH(req: Request) {
  const g = await gate(req, "settings:write");
  if (isDenied(g)) return g.denied;
  try {
    const body = (await readJson<Partial<HotelDto>>(req)) ?? {};
    const existing = await prisma.hotel.findUnique({ where: { id: HOTEL_ID } });
    if (!existing) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const updated = await prisma.hotel.update({
      where: { id: HOTEL_ID },
      data: {
        name: str(body.name, existing.name),
        tagline: str(body.tagline, existing.tagline),
        email: str(body.email, existing.email),
        phone: str(body.phone, existing.phone),
        lineId: str(body.lineId, existing.lineId),
        address: str(body.address, existing.address),
        addressLine: str(body.addressLine, existing.addressLine),
        city: str(body.city, existing.city),
        country: str(body.country, existing.country),
        postalCode: str(body.postalCode, existing.postalCode),
        lat: typeof body.lat === "number" ? body.lat : existing.lat,
        lng: typeof body.lng === "number" ? body.lng : existing.lng,
        checkInTime: str(body.checkInTime, existing.checkInTime),
        checkOutTime: str(body.checkOutTime, existing.checkOutTime),
        cancelPolicy: str(body.cancelPolicy, existing.cancelPolicy, 2000),
        petsPolicy: str(body.petsPolicy, existing.petsPolicy, 2000),
        depositPct:
          typeof body.depositPct === "number" && body.depositPct >= 0 && body.depositPct <= 100
            ? Math.round(body.depositPct)
            : existing.depositPct,
        reservationsEnabled:
          typeof body.reservationsEnabled === "boolean"
            ? body.reservationsEnabled
            : existing.reservationsEnabled,
        serviceStart: str(body.serviceStart, existing.serviceStart),
        serviceEnd: str(body.serviceEnd, existing.serviceEnd),
        maxPartySize:
          typeof body.maxPartySize === "number" && body.maxPartySize > 0
            ? Math.round(body.maxPartySize)
            : existing.maxPartySize,
        diningHeroImage: str(body.diningHeroImage, existing.diningHeroImage, 1000),
        eventsHeroImage: str(body.eventsHeroImage, existing.eventsHeroImage, 1000),
        timeZone: str(body.timeZone, existing.timeZone, 60),
        baseCurrency: str(body.baseCurrency, existing.baseCurrency, 3).toUpperCase() || "THB",
        promptPayId: str(body.promptPayId, existing.promptPayId, 20),
        bankName: str(body.bankName, existing.bankName),
        bankAccountName: str(body.bankAccountName, existing.bankAccountName),
        bankAccountNo: str(body.bankAccountNo, existing.bankAccountNo, 40),
        bankSwift: str(body.bankSwift, existing.bankSwift, 20),
      },
    });

    revalidateHotel();
    await audit(g.actor, "hotel.updated", "hotel", HOTEL_ID, { keys: Object.keys(body) });
    return NextResponse.json(toDto(updated));
  } catch (e) {
    console.error("[api/hotel PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
