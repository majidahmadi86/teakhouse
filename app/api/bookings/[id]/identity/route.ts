import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { gate, isDenied } from "@/lib/api";
import { isVaultEnabled, maskId, openIdentity } from "@/lib/vault";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * v15 · Reveal a guest's identity document · only for `guests:identity`, and
 * every reveal is written to the audit trail with who asked.
 */
export async function GET(req: Request, { params }: Ctx) {
  const g = await gate(req, "guests:identity");
  if (isDenied(g)) return g.denied;
  const row = await prisma.booking.findUnique({
    where: { id: params.id },
    select: { id: true, code: true, passportId: true, nationality: true, vault: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const sealed = row.vault ? openIdentity(row.vault) : null;
  const passportId = sealed?.passportId ?? row.passportId ?? "";
  const nationality = sealed?.nationality ?? row.nationality ?? "";
  await audit(g.actor, "identity.revealed", "booking", row.id, { code: row.code });
  return NextResponse.json({
    passportId,
    nationality,
    masked: maskId(passportId),
    vault: isVaultEnabled() && Boolean(row.vault),
  });
}
