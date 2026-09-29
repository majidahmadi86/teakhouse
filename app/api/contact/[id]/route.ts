import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contactMessageToClient } from "@/lib/contactMessages";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const STATUSES = ["new", "read", "done"];

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const patch = (await req.json()) as { status?: string };
    if (patch.status !== undefined && !STATUSES.includes(patch.status)) {
      return NextResponse.json({ error: "Bad status" }, { status: 400 });
    }
    const existing = await prisma.contactMessage.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = await prisma.contactMessage.update({
      where: { id: params.id },
      data: { status: patch.status ?? existing.status },
    });
    return NextResponse.json(contactMessageToClient(updated));
  } catch (e) {
    console.error("[api/contact PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await prisma.contactMessage.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/contact DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
