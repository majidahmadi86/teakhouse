import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * v15 · Password hashing with scrypt (node:crypto, no dependency).
 *
 * Format: `scrypt$<salt-hex>$<hash-hex>`. Anything that does not start with
 * `scrypt$` is treated as a LEGACY PLAINTEXT value: the v14 guest table stored
 * passwords as typed. verifyPassword() accepts those once, and the caller
 * rewrites the row with a hash on that sign-in, so the table upgrades itself.
 */

const KEY_LEN = 64;
const COST = { N: 16384, r: 8, p: 1 };

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LEN, COST);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function isHashed(stored: string): boolean {
  return stored.startsWith("scrypt$");
}

/**
 * True when the candidate matches the stored value. Returns `upgrade: true`
 * when the stored value was plaintext and should be rewritten as a hash.
 */
export function verifyPassword(
  candidate: string,
  stored: string
): { ok: boolean; upgrade: boolean } {
  if (!isHashed(stored)) {
    const a = Buffer.from(candidate);
    const b = Buffer.from(stored);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    return { ok, upgrade: ok };
  }
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return { ok: false, upgrade: false };
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(candidate, Buffer.from(saltHex, "hex"), expected.length, COST);
  const ok = actual.length === expected.length && timingSafeEqual(actual, expected);
  return { ok, upgrade: false };
}
