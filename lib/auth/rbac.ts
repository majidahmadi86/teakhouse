/**
 * v15 · Role-based access control · pure, shared by server guards and the
 * owner UI (which hides what a role cannot do rather than showing a 403).
 *
 * Four roles, one property each. The matrix is deliberately small and
 * explicit: a permission is a verb on a noun, and a role either has it or not.
 */

export type Role = "owner" | "manager" | "frontdesk" | "housekeeping";

export const ROLES: Role[] = ["owner", "manager", "frontdesk", "housekeeping"];

export type Permission =
  | "analytics:read"
  | "reports:write"
  | "bookings:read"
  | "bookings:write"
  | "bookings:checkin"
  | "guests:read"
  | "guests:identity"
  | "guests:notes"
  | "rooms:write"
  | "rates:write"
  | "housekeeping:write"
  | "requests:read"
  | "requests:write"
  | "messages:read"
  | "messages:write"
  | "content:write"
  | "channels:read"
  | "channels:write"
  | "payments:read"
  | "settings:write"
  | "staff:write"
  | "audit:read";

const ALL: Role[] = ["owner", "manager", "frontdesk", "housekeeping"];
const DESK: Role[] = ["owner", "manager", "frontdesk"];
const MGMT: Role[] = ["owner", "manager"];

export const PERMISSIONS: Record<Permission, Role[]> = {
  "analytics:read": MGMT,
  "reports:write": MGMT,
  "bookings:read": DESK,
  "bookings:write": DESK,
  "bookings:checkin": DESK,
  "guests:read": DESK,
  "guests:identity": DESK,
  "guests:notes": DESK,
  "rooms:write": MGMT,
  "rates:write": MGMT,
  "housekeeping:write": ALL,
  "requests:read": ALL,
  "requests:write": ALL,
  "messages:read": DESK,
  "messages:write": DESK,
  "content:write": MGMT,
  "channels:read": MGMT,
  "channels:write": ["owner"],
  "payments:read": MGMT,
  "settings:write": ["owner"],
  "staff:write": ["owner"],
  "audit:read": MGMT,
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[permission].includes(role);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

/** Owner-panel sections a role may open · drives the sidebar and route guards. */
export const SECTION_PERMISSION: Record<string, Permission | null> = {
  "/owner": null, // everyone lands somewhere · the shell picks the home per role
  "/owner/desk": "requests:read",
  "/owner/bookings": "bookings:read",
  "/owner/rooms": "rooms:write",
  "/owner/dining": "content:write",
  "/owner/events": "content:write",
  "/owner/messages": "messages:read",
  "/owner/rates": "rates:write",
  "/owner/calendar": "bookings:read",
  "/owner/packages": "content:write",
  "/owner/channels": "channels:read",
  "/owner/settings": "settings:write",
};

/** Where a role lands when it opens /owner. */
export function homeFor(role: Role): string {
  if (role === "owner" || role === "manager") return "/owner";
  return "/owner/desk";
}
