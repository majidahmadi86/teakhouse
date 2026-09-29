import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  CONTACT_PURPOSES,
  contactMessageToClient,
  normalizeContactExtras,
  validateContact,
  type ContactInput,
  type ContactPurpose,
} from "@/lib/contactMessages";

export const dynamic = "force-dynamic";

/** Owner list · newest first. */
export async function GET() {
  const rows = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(rows.map(contactMessageToClient));
}

export async function POST(req: Request) {
  let body: Partial<ContactInput>;
  try {
    body = (await req.json()) as Partial<ContactInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const purpose: ContactPurpose = (
    CONTACT_PURPOSES as readonly string[]
  ).includes(String(body.purpose))
    ? (body.purpose as ContactPurpose)
    : "other";

  const input: ContactInput = {
    purpose,
    name: String(body.name ?? ""),
    contact: String(body.contact ?? ""),
    message: String(body.message ?? ""),
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    date: body.date,
    party: typeof body.party === "number" ? body.party : null,
  };

  const invalid = validateContact(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    const created = await prisma.contactMessage.create({
      data: {
        purpose,
        name: input.name.trim(),
        contact: input.contact.trim(),
        message: input.message.trim(),
        ...normalizeContactExtras(input),
      },
    });
    return NextResponse.json(contactMessageToClient(created), { status: 201 });
  } catch (e) {
    console.error("[api/contact POST]", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
