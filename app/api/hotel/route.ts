import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { HotelDto } from "@/lib/ownerTypes";
import { revalidateHotel } from "@/lib/revalidate";
import { requireOwner } from "@/lib/ownerSession";
import { readOnlyResponse } from "@/lib/readOnly";

export const dynamic = "force-dynamic";

const HOTEL_ID = "default";

function toDto(row: {
  id: string;
  name: string;
  tagline: string;
  email: string;
  phone: string;
  lineId: string;
  address: string;
  addressLine: string;
  city: string;
  country: string;
  postalCode: string;
  lat: number;
  lng: number;
  checkInTime: string;
  checkOutTime: string;
  cancelPolicy: string;
  petsPolicy: string;
  depositPct: number;
  reservationsEnabled: boolean;
  serviceStart: string;
  serviceEnd: string;
  maxPartySize: number;
  diningHeroImage: string;
  eventsHeroImage: string;
}): HotelDto {
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
  };
}

export async function GET() {
  const row = await prisma.hotel.findUnique({ where: { id: HOTEL_ID } });
  if (!row) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  return NextResponse.json(toDto(row));
}

export async function PATCH(req: Request) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    const body = (await req.json()) as Partial<HotelDto>;
    // v18 · the deposit share drives /book and every confirmation, so it is
    // checked here as well as in the Settings form.
    if (
      body.depositPct !== undefined &&
      !(Number.isInteger(body.depositPct) && body.depositPct >= 0 && body.depositPct <= 100)
    ) {
      return NextResponse.json(
        { error: "invalid", field: "depositPct", message: "The deposit must be a whole number from 0 to 100." },
        { status: 400 }
      );
    }
    if (body.email !== undefined && !/^\S+@\S+\.\S+$/.test(String(body.email).trim())) {
      return NextResponse.json(
        { error: "invalid", field: "email", message: "The email address is not valid." },
        { status: 400 }
      );
    }
    const existing = await prisma.hotel.findUnique({ where: { id: HOTEL_ID } });
    if (!existing) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const updated = await prisma.hotel.update({
      where: { id: HOTEL_ID },
      data: {
        name: body.name ?? existing.name,
        tagline: body.tagline ?? existing.tagline,
        email: body.email ?? existing.email,
        phone: body.phone ?? existing.phone,
        lineId: body.lineId ?? existing.lineId,
        address: body.address ?? existing.address,
        addressLine: body.addressLine ?? existing.addressLine,
        city: body.city ?? existing.city,
        country: body.country ?? existing.country,
        postalCode: body.postalCode ?? existing.postalCode,
        lat: typeof body.lat === "number" ? body.lat : existing.lat,
        lng: typeof body.lng === "number" ? body.lng : existing.lng,
        checkInTime: body.checkInTime ?? existing.checkInTime,
        checkOutTime: body.checkOutTime ?? existing.checkOutTime,
        cancelPolicy: body.cancelPolicy ?? existing.cancelPolicy,
        petsPolicy: body.petsPolicy ?? existing.petsPolicy,
        depositPct:
          typeof body.depositPct === "number"
            ? body.depositPct
            : existing.depositPct,
        reservationsEnabled:
          typeof body.reservationsEnabled === "boolean"
            ? body.reservationsEnabled
            : existing.reservationsEnabled,
        serviceStart: body.serviceStart ?? existing.serviceStart,
        serviceEnd: body.serviceEnd ?? existing.serviceEnd,
        maxPartySize:
          typeof body.maxPartySize === "number" && body.maxPartySize > 0
            ? body.maxPartySize
            : existing.maxPartySize,
        diningHeroImage: body.diningHeroImage ?? existing.diningHeroImage,
        eventsHeroImage: body.eventsHeroImage ?? existing.eventsHeroImage,
      },
    });

    revalidateHotel();

    return NextResponse.json(toDto(updated));
  } catch (e) {
    console.error("[api/hotel PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
