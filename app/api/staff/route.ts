import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { audit, SYSTEM } from "@/lib/audit";
import { bad, gate, isDenied, readJson } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isRole, PERMISSIONS, type Role } from "@/lib/auth/rbac";
import {
  clearedStaffCookie,
  clientIp,
  createStaffSession,
  destroyStaffSession,
  getStaffActor,
  isDemoSandbox,
  staffCookie,
} from "@/lib/auth/session";
import { limitOrReject } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * v15 · Staff sessions.
 *
 *   GET            · who am I (role, permissions, whether this is the sandbox)
 *   POST login     · email + password → HttpOnly session cookie
 *   POST logout    · destroy the session row and clear the cookie
 *   POST switch    · DEMO ONLY · sign in as a seeded staff member by role, so
 *                    the sandbox can show what each role sees
 *   POST invite    · owner creates a staff account
 */

type Body = {
  action?: "login" | "logout" | "switch" | "invite" | "deactivate";
  email?: string;
  password?: string;
  role?: string;
  name?: string;
  staffId?: string;
};

function permissionsFor(role: Role): string[] {
  return (Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]).filter((p) =>
    PERMISSIONS[p].includes(role)
  );
}

export async function GET(req: Request) {
  const actor = await getStaffActor(req);
  if (!actor) return NextResponse.json({ signedIn: false, sandbox: false }, { status: 401 });
  return NextResponse.json({
    signedIn: true,
    sandbox: actor.sandbox,
    demo: isDemoSandbox(),
    id: actor.id,
    name: actor.name,
    email: actor.email,
    role: actor.role,
    permissions: permissionsFor(actor.role),
  });
}

export async function POST(req: Request) {
  const body = (await readJson<Body>(req)) ?? {};

  if (body.action === "login") {
    const limited = limitOrReject(req, "auth");
    if (limited) return limited;
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const staff = await prisma.staffUser.findUnique({ where: { email } });
    const check = staff ? verifyPassword(password, staff.passwordHash) : { ok: false, upgrade: false };
    if (!staff || !staff.active || !check.ok) {
      await audit(SYSTEM, "staff.login.failed", "staff", "", { email });
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    }
    const { token, expiresAt } = await createStaffSession(staff.id, {
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent") ?? "",
    });
    await prisma.staffUser.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
    await audit({ id: staff.id, role: staff.role }, "staff.login", "staff", staff.id);
    const res = NextResponse.json({ ok: true, role: staff.role, name: staff.name });
    res.cookies.set(staffCookie(token, expiresAt));
    return res;
  }

  if (body.action === "logout") {
    await destroyStaffSession(req);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(clearedStaffCookie());
    return res;
  }

  if (body.action === "switch") {
    if (!isDemoSandbox()) return bad("Role switching is a demo feature", 403);
    if (!isRole(body.role)) return bad("role required");
    const staff = await prisma.staffUser.findFirst({ where: { role: body.role, active: true } });
    if (!staff) return bad("no seeded staff for that role", 404);
    await destroyStaffSession(req);
    const { token, expiresAt } = await createStaffSession(staff.id, { ip: clientIp(req) });
    const res = NextResponse.json({ ok: true, role: staff.role, name: staff.name });
    res.cookies.set(staffCookie(token, expiresAt));
    return res;
  }

  const g = await gate(req, "staff:write");
  if (isDenied(g)) return g.denied;

  if (body.action === "invite") {
    const email = (body.email ?? "").trim().toLowerCase();
    const name = (body.name ?? "").trim().slice(0, 120);
    if (!email || !name || !isRole(body.role) || (body.password ?? "").length < 8) {
      return bad("email, name, role and a password of 8+ characters are required");
    }
    const staff = await prisma.staffUser.create({
      data: { email, name, role: body.role, passwordHash: hashPassword(body.password!) },
    });
    await audit(g.actor, "staff.invited", "staff", staff.id, { role: staff.role });
    return NextResponse.json({ id: staff.id, email, name, role: staff.role }, { status: 201 });
  }

  if (body.action === "deactivate") {
    if (!body.staffId) return bad("staffId required");
    await prisma.staffUser.update({ where: { id: body.staffId }, data: { active: false } });
    await prisma.staffSession.deleteMany({ where: { staffId: body.staffId } });
    await audit(g.actor, "staff.deactivated", "staff", body.staffId);
    return NextResponse.json({ ok: true });
  }

  return bad("Unknown action");
}
