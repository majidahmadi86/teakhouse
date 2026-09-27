import { prisma } from "@/lib/db";
import { getHotelId } from "@/lib/tenant";
import type { StaffActor } from "@/lib/auth/session";

/**
 * v15 · Audit trail · one line per staff or system mutation.
 *
 * Fire-and-forget by design: a failed audit write must never fail the action
 * it describes, but it is logged loudly so a silent gap cannot go unnoticed.
 */

export type AuditActor = Pick<StaffActor, "id" | "role"> | { id: string | null; role: string };

export const SYSTEM: AuditActor = { id: null, role: "system" };
export const GUEST: AuditActor = { id: null, role: "guest" };

export async function audit(
  actor: AuditActor,
  action: string,
  entity: string,
  entityId = "",
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        hotelId: getHotelId(),
        actorId: actor.id,
        actorRole: actor.role,
        action,
        entity,
        entityId,
        meta: JSON.stringify(meta).slice(0, 4000),
      },
    });
  } catch (e) {
    console.error("[audit] write failed", action, entity, entityId, e);
  }
}
