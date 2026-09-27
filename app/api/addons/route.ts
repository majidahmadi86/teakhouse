import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { addonToClient, isAddonCategory, isAddonUnit, type Addon } from "@/lib/addons";
import { revalidateRooms } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

/** Published packages for the booking page; staff get the full list with ?all=1. */
export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.get("all") === "1";
  if (all) {
    const g = await gate(req, "content:write");
    if (isDenied(g)) return g.denied;
  }
  const rows = await prisma.addon.findMany({
    where: all ? {} : { published: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(rows.map(addonToClient));
}

type Body = Partial<Addon> & { key?: string };

export async function POST(req: Request) {
  const g = await gate(req, "content:write");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<Body>(req)) ?? {};
  const key = (body.key ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  if (!key || !body.name?.en || typeof body.price !== "number" || body.price < 0) {
    return bad("key, name.en and a non-negative price are required");
  }
  const created = await prisma.addon.create({
    data: {
      key,
      nameEn: body.name.en.trim(),
      nameTh: (body.name.th ?? body.name.en).trim(),
      descriptionEn: body.description?.en ?? "",
      descriptionTh: body.description?.th ?? body.description?.en ?? "",
      category: isAddonCategory(body.category) ? body.category : "experience",
      price: Math.round(body.price),
      unit: isAddonUnit(body.unit) ? body.unit : "stay",
      image: body.image ?? "",
      order: typeof body.order === "number" ? body.order : 0,
      published: body.published ?? true,
    },
  });
  revalidateRooms();
  await audit(g.actor, "addon.created", "addon", created.id, { key });
  return NextResponse.json(addonToClient(created), { status: 201 });
}
