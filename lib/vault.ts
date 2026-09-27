import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * v15 · Guest data vault · AES-256-GCM.
 *
 * Passport numbers and other identity fields are what an ultra-high-net-worth
 * guest is actually worried about. With GUEST_VAULT_KEY set, those fields are
 * sealed before they reach the database and opened only for a staff role that
 * holds `guests:identity`. The plaintext columns stay null. A database dump,
 * a backup, or a misrouted query then contains ciphertext and nothing else.
 *
 * The same primitive protects channel secrets (Channel.secretEnc).
 *
 * Key: 32 bytes as base64 or hex. Without a key the vault is OFF · callers
 * fall back to the v14 behaviour (plaintext columns) and isVaultEnabled()
 * tells the settings page to say so out loud.
 */

const PREFIX = "v1";

function loadKey(): Buffer | null {
  const raw = process.env.GUEST_VAULT_KEY?.trim();
  if (!raw) return null;
  try {
    const buf = /^[0-9a-fA-F]{64}$/.test(raw)
      ? Buffer.from(raw, "hex")
      : Buffer.from(raw, "base64");
    if (buf.length === 32) return buf;
    // Any other length · derive a 32-byte key deterministically rather than
    // silently running unencrypted because someone pasted a passphrase.
    return createHash("sha256").update(raw).digest();
  } catch {
    return null;
  }
}

export function isVaultEnabled(): boolean {
  return loadKey() !== null;
}

export function seal(plain: string): string | null {
  const key = loadKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

export function open(sealed: string): string | null {
  const key = loadKey();
  if (!key || !sealed) return null;
  const [prefix, ivB, tagB, ctB] = sealed.split(".");
  if (prefix !== PREFIX || !ivB || !tagB || !ctB) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB, "base64url"));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB, "base64url")), decipher.final()]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}

export type Identity = { passportId?: string | null; nationality?: string | null };

/** Seal an identity object as JSON · null when the vault is off. */
export function sealIdentity(identity: Identity): string | null {
  const clean: Identity = {};
  if (identity.passportId) clean.passportId = identity.passportId;
  if (identity.nationality) clean.nationality = identity.nationality;
  if (!clean.passportId && !clean.nationality) return null;
  return seal(JSON.stringify(clean));
}

export function openIdentity(vault: string): Identity | null {
  const json = open(vault);
  if (!json) return null;
  try {
    return JSON.parse(json) as Identity;
  } catch {
    return null;
  }
}

/** "AB1••••89" · what a role without `guests:identity` sees. */
export function maskId(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return `${value.slice(0, 2)}••••${value.slice(-2)}`;
}
