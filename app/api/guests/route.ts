import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { maskId } from "@/lib/vault";

export const dynamic = "force-dynamic";

/**
 * v15 · Guest profiles + preference log · staff only.
 *
 *   GET  ?q=           · search by name/email/phone · identity fields are MASKED
 *   POST { action: "note", guestId, tag, body }     · add a preference-log line
 *   POST { action: "profile", guestId, vip, preferences, language }
 */
export async function GET(req: Request) {
  const g = await gate(req, "guests:read");
  if (isDenied(g)) return g.denied;
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  const rows = await prisma.guest.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : {},
    orderBy: { updatedAt: "desc" },
    take: 60,
    include: { notes: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      nationality: r.nationality,
      passportMasked: maskId(r.passportId),
      vip: r.vip,
      preferences: r.preferences,
      language: r.language,
      notes: r.notes.map((n) => ({
        id: n.id,
        tag: n.tag,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
      })),
    }))
  );
}

type Body = {
  action?: "note" | "profile";
  guestId?: string;
  tag?: string;
  body?: string;
  vip?: boolean;
  preferences?: string;
  language?: string;
};

export async function POST(req: Request) {
  const g = await gate(req, "guests:notes");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<Body>(req)) ?? {};
  if (!body.guestId) return bad("guestId required");

  if (body.action === "note") {
    const text = (body.body ?? "").trim().slice(0, 1000);
    if (!text) return bad("body required");
    const note = await prisma.guestNote.create({
      data: {
        guestId: body.guestId,
        tag: ["preference", "allergy", "occasion", "incident", "note"].includes(body.tag ?? "") ? body.tag! : "note",
        body: text,
        authorId: g.actor.sandbox ? null : g.actor.id,
      },
    });
    await audit(g.actor, "guest.note", "guest", body.guestId, { tag: note.tag });
    return NextResponse.json({ id: note.id, tag: note.tag, body: note.body, createdAt: note.createdAt.toISOString() }, { status: 201 });
  }

  if (body.action === "profile") {
    const updated = await prisma.guest.update({
      where: { id: body.guestId },
      data: {
        ...(typeof body.vip === "boolean" ? { vip: body.vip } : {}),
        ...(typeof body.preferences === "string" ? { preferences: body.preferences.slice(0, 2000) } : {}),
        ...(body.language === "en" || body.language === "th" ? { language: body.language } : {}),
      },
    });
    await audit(g.actor, "guest.profile", "guest", body.guestId);
    return NextResponse.json({ id: updated.id, vip: updated.vip, preferences: updated.preferences, language: updated.language });
  }

  return bad("Unknown action");
}
