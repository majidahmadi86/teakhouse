import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { gate, isDenied, readJson } from "@/lib/api";
import { addonToClient, isAddonCategory, isAddonUnit, type Addon } from "@/lib/addons";
import { revalidateRooms } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await gate(req, "content:write");
  if (isDenied(g)) return g.denied;
  const patch = (await readJson<Partial<Addon>>(req)) ?? {};
  const existing = await prisma.addon.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.addon.update({
    where: { id: params.id },
    data: {
      nameEn: patch.name?.en?.trim() ?? existing.nameEn,
      nameTh: patch.name?.th?.trim() ?? existing.nameTh,
      descriptionEn: patch.description?.en ?? existing.descriptionEn,
      descriptionTh: patch.description?.th ?? existing.descriptionTh,
      category: isAddonCategory(patch.category) ? patch.category : existing.category,
      price: typeof patch.price === "number" && patch.price >= 0 ? Math.round(patch.price) : existing.price,
      unit: isAddonUnit(patch.unit) ? patch.unit : existing.unit,
      image: patch.image ?? existing.image,
      order: typeof patch.order === "number" ? patch.order : existing.order,
      published: typeof patch.published === "boolean" ? patch.published : existing.published,
    },
  });
  revalidateRooms();
  await audit(g.actor, "addon.updated", "addon", params.id);
  return NextResponse.json(addonToClient(updated));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await gate(req, "content:write");
  if (isDenied(g)) return g.denied;
  await prisma.addon.delete({ where: { id: params.id } }).catch(() => undefined);
  revalidateRooms();
  await audit(g.actor, "addon.deleted", "addon", params.id);
  return NextResponse.json({ ok: true });
}
