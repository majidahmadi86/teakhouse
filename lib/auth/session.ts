import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { can, isRole, type Permission, type Role } from "./rbac";

/**
 * v15 · Sessions.
 *
 * Staff: a random 256-bit token in an HttpOnly cookie, its SHA-256 in the
 * StaffSession table. Revocable (delete the row), expiring (12h), and never
 * readable from JavaScript. The v14 panel trusted a PIN checked in the browser
 * and a localStorage flag, and every /api mutation was open · the PIN was a
 * curtain, not a lock.
 *
 * Guests: a stateless signed cookie `uid.exp.sig`. Guests do not need
 * revocation lists; they need not to be enumerable · the old scheme put the
 * user id in localStorage and let anyone GET /api/users?id=… for any id.
 *
 * Demo sandbox: with DEMO_MODE=true and no session, staff guards resolve to a
 * sandbox owner so the public demo keeps working, and the role switcher in the
 * panel creates real sessions to show the gating. AUTH_ENFORCE=true turns the
 * sandbox pass-through off without touching anything else.
 */

export const STAFF_COOKIE = "tkh-staff";
export const GUEST_COOKIE = "tkh-guest";
const STAFF_TTL_MS = 12 * 60 * 60 * 1000;
const GUEST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type StaffActor = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** true when this actor is the DEMO sandbox pass-through, not a signed-in person */
  sandbox: boolean;
};

function secure(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDemoSandbox(): boolean {
  if (process.env.AUTH_ENFORCE === "true") return false;
  return (
    process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Secret for guest cookies. SESSION_SECRET in production; the demo derives one
 * from values that already exist so it works out of the box, and a missing
 * DATABASE_URL still yields a stable (if weak) key rather than a crash.
 */
function sessionSecret(): string {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return explicit;
  return sha256(
    `tkh|${process.env.OWNER_PIN ?? ""}|${process.env.DATABASE_URL ?? "local"}`
  );
}

/* ── Staff ──────────────────────────────────────────────────────────────── */

export async function createStaffSession(
  staffId: string,
  meta: { ip?: string; userAgent?: string } = {}
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + STAFF_TTL_MS);
  await prisma.staffSession.create({
    data: {
      staffId,
      tokenHash: sha256(token),
      expiresAt,
      ip: meta.ip ?? "",
      userAgent: (meta.userAgent ?? "").slice(0, 200),
    },
  });
  return { token, expiresAt };
}

export function staffCookie(token: string, expiresAt: Date) {
  return {
    name: STAFF_COOKIE,
    value: token,
    httpOnly: true,
    secure: secure(),
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export function clearedStaffCookie() {
  return {
    name: STAFF_COOKIE,
    value: "",
    httpOnly: true,
    secure: secure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

async function staffFromToken(token: string | undefined): Promise<StaffActor | null> {
  if (!token) return null;
  const row = await prisma.staffSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { staff: true },
  });
  if (!row || row.expiresAt < new Date() || !row.staff.active) return null;
  if (!isRole(row.staff.role)) return null;
  return {
    id: row.staff.id,
    name: row.staff.name,
    email: row.staff.email,
    role: row.staff.role,
    sandbox: false,
  };
}

function tokenFromRequest(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie") ?? "";
  const m = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** The signed-in staff member for a route handler request, or null. */
export async function getStaffActor(req?: Request): Promise<StaffActor | null> {
  const token = req
    ? tokenFromRequest(req, STAFF_COOKIE)
    : cookies().get(STAFF_COOKIE)?.value;
  const actor = await staffFromToken(token);
  if (actor) return actor;
  if (isDemoSandbox()) {
    return {
      id: "sandbox",
      name: "Demo owner",
      email: "owner@teakhouse.demo",
      role: "owner",
      sandbox: true,
    };
  }
  return null;
}

export async function destroyStaffSession(req: Request): Promise<void> {
  const token = tokenFromRequest(req, STAFF_COOKIE);
  if (!token) return;
  await prisma.staffSession.deleteMany({ where: { tokenHash: sha256(token) } });
}

export type Guard =
  | { ok: true; actor: StaffActor }
  | { ok: false; response: NextResponse };

/**
 * Route-handler guard. `requireStaff(req, "bookings:write")` either hands back
 * the actor or a ready-to-return 401/403.
 */
export async function requireStaff(
  req: Request,
  permission?: Permission
): Promise<Guard> {
  const actor = await getStaffActor(req);
  if (!actor) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in required" }, { status: 401 }),
    };
  }
  if (permission && !can(actor.role, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Not allowed for this role", role: actor.role, permission },
        { status: 403 }
      ),
    };
  }
  return { ok: true, actor };
}

/* ── Guests ─────────────────────────────────────────────────────────────── */

function signGuest(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function guestCookie(userId: string) {
  const exp = Date.now() + GUEST_TTL_MS;
  const payload = `${userId}.${exp}`;
  return {
    name: GUEST_COOKIE,
    value: `${payload}.${signGuest(payload)}`,
    httpOnly: true,
    secure: secure(),
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(exp),
  };
}

export function clearedGuestCookie() {
  return {
    name: GUEST_COOKIE,
    value: "",
    httpOnly: true,
    secure: secure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

/** The guest user id carried by a valid guest cookie, or null. */
export function getGuestUserId(req: Request): string | null {
  const raw = tokenFromRequest(req, GUEST_COOKIE);
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return null;
  const expected = signGuest(`${uid}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return uid;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}
