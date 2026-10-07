import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { EmailTemplateDto } from "@/lib/ownerTypes";
import { requireOwner } from "@/lib/ownerSession";
import { readOnlyResponse } from "@/lib/readOnly";

export const dynamic = "force-dynamic";

const HOTEL_ID = "default";
const TEMPLATE_KEY = "booking_confirmation";

const DEFAULT_SUBJECT = "Your stay at {{hotelName}} · {{code}}";
const DEFAULT_BODY =
  "Dear {{guestName}},\n\nThank you for booking {{roomName}} from {{checkIn}} to {{checkOut}}.\nTotal: {{amount}}\nDeposit received: {{deposit}}\n\nSee you by the river.\n{{hotelName}}";

async function findTemplate() {
  return prisma.emailTemplate.findUnique({
    where: { hotelId_key: { hotelId: HOTEL_ID, key: TEMPLATE_KEY } },
  });
}

/** Owner writes only · creates the row when it is missing. */
async function ensureTemplate() {
  const existing = await findTemplate();
  if (existing) return existing;
  return prisma.emailTemplate.create({
    data: {
      hotelId: HOTEL_ID,
      key: TEMPLATE_KEY,
      subject: DEFAULT_SUBJECT,
      body: DEFAULT_BODY,
    },
  });
}

function toDto(row: {
  id: string;
  hotelId: string;
  key: string;
  subject: string;
  body: string;
}): EmailTemplateDto {
  return {
    id: row.id,
    hotelId: row.hotelId,
    key: row.key,
    subject: row.subject,
    body: row.body,
  };
}

/**
 * Read-only. A missing row is answered with the default template (id "")
 * instead of being created: a GET must never write. The first owner save
 * creates it.
 */
export async function GET() {
  try {
    const row = await findTemplate();
    return NextResponse.json(
      toDto(
        row ?? {
          id: "",
          hotelId: HOTEL_ID,
          key: TEMPLATE_KEY,
          subject: DEFAULT_SUBJECT,
          body: DEFAULT_BODY,
        }
      )
    );
  } catch (e) {
    console.error("[api/email-template GET]", e);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    const body = (await req.json()) as { subject?: string; body?: string };
    const existing = await ensureTemplate();
    const updated = await prisma.emailTemplate.update({
      where: { id: existing.id },
      data: {
        subject: body.subject ?? existing.subject,
        body: body.body ?? existing.body,
      },
    });
    return NextResponse.json(toDto(updated));
  } catch (e) {
    console.error("[api/email-template PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ro = readOnlyResponse();
  if (ro) return ro;
  const denied = requireOwner(req);
  if (denied) return denied;
  return PATCH(req);
}
