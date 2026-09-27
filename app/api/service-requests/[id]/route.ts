import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { isRequestStatus, requestToClient } from "@/lib/serviceRequests";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await gate(req, "requests:write");
  if (isDenied(g)) return g.denied;
  const body = (await readJson<{ status?: string; details?: string }>(req)) ?? {};
  if (body.status !== undefined && !isRequestStatus(body.status)) return bad("bad status");
  const updated = await prisma.serviceRequest
    .update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(typeof body.details === "string" ? { details: body.details.slice(0, 2000) } : {}),
      },
      include: { booking: { select: { code: true, guest: true, roomSlug: true } } },
    })
    .catch(() => null);
  if (!updated) return bad("Not found", 404);
  await audit(g.actor, "request.updated", "serviceRequest", params.id, { status: body.status });
  return NextResponse.json(requestToClient(updated));
}
