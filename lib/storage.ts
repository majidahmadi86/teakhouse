/**
 * v13 · Supabase Storage · SERVER ONLY.
 *
 * The service role key can create and overwrite anything in the project, so it
 * never leaves the server: this module is imported by the upload route alone,
 * and nothing here is exported to a client component. Uploads go through the
 * Storage REST API directly · no extra SDK dependency for two calls.
 *
 * Until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY exist, `storageConfigured()`
 * is false and the owner managers say so instead of offering a dead control.
 */

export const MEDIA_BUCKET = "hotel-media";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedMime = (typeof ALLOWED_MIME)[number];

const EXT: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Normalise whatever SUPABASE_URL was pasted into the project settings.
 *
 * The value that is easiest to reach for is the one from the database
 * connection string, `db.<ref>.supabase.co`, which does not serve the Storage
 * API · requests to it simply never connect. The API lives at
 * `https://<ref>.supabase.co`. Rather than fail on a plausible mistake, map it,
 * add the protocol if it is missing, and drop any trailing slash or path.
 */
export function normalizeSupabaseUrl(raw: string): string {
  let value = raw.trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let host: string;
  try {
    host = new URL(value).host;
  } catch {
    return "";
  }
  host = host.replace(/^db\./i, "");
  return `https://${host}`;
}

function env(): { url: string; key: string } | null {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL ?? "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return { url, key };
}

export function storageConfigured(): boolean {
  return env() !== null;
}

/** A real hostname · letters, digits, dots and dashes, with a TLD. */
const HOSTNAME = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/**
 * The storage host, for diagnostics.
 *
 * Echoed ONLY when the configured value actually parses as a hostname. If
 * someone pastes a key into SUPABASE_URL by mistake, this endpoint must not
 * hand that key back to an unauthenticated caller · it answers "invalid-url"
 * instead, which is all the operator needs to know to go and fix it.
 */
export function storageHost(): string {
  const cfg = env();
  if (!cfg) return "";
  let host: string;
  try {
    host = new URL(cfg.url).host;
  } catch {
    return "invalid-url";
  }
  return HOSTNAME.test(host) ? host : "invalid-url";
}

export function isAllowedMime(type: string): type is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(type);
}

/**
 * Object key · `<folder>/<time>-<random>.<ext>`. The guest-facing URL is
 * public, so the name carries nothing about the guest or the hotel beyond the
 * folder, and a repeat upload of the same file never collides.
 */
export function mediaKey(folder: string, mime: AllowedMime): string {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").slice(0, 32) || "misc";
  const rand = Math.random().toString(36).slice(2, 10);
  return `${safeFolder}/${Date.now()}-${rand}.${EXT[mime]}`;
}

/**
 * Create the bucket · public read, and the same size/mime limits the route
 * enforces so a leaked token cannot push a 2GB file either. "Already exists"
 * counts as success. Returns a short reason rather than throwing, so the
 * caller can report WHY without ever touching the key.
 */
async function createBucket(
  url: string,
  key: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  let res: Response;
  try {
    res = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: MEDIA_BUCKET,
        name: MEDIA_BUCKET,
        public: true,
        file_size_limit: MAX_UPLOAD_BYTES,
        allowed_mime_types: ALLOWED_MIME,
      }),
    });
  } catch (e) {
    // Wrong host in SUPABASE_URL lands here · say so, do not leak the value.
    return { ok: false, reason: `unreachable:${(e as Error).message.slice(0, 60)}` };
  }

  if (res.ok) return { ok: true };
  const body = await res.text().catch(() => "");
  if (/already exists|Duplicate/i.test(body)) return { ok: true };
  return { ok: false, reason: `${res.status}:${body.slice(0, 120)}` };
}

function objectUrl(url: string, key: string): string {
  return `${url}/storage/v1/object/${MEDIA_BUCKET}/${key}`;
}

async function putObject(
  cfg: { url: string; key: string },
  key: string,
  body: ArrayBuffer,
  mime: AllowedMime
): Promise<Response | null> {
  try {
    return await fetch(objectUrl(cfg.url, key), {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body,
    });
  } catch (e) {
    console.error("[storage] put unreachable", e);
    return null;
  }
}

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string; detail?: string };

/**
 * Upload first, create the bucket only if the object store says it is missing.
 *
 * Doing it the other way round meant every upload needed bucket-create rights
 * and a create round trip. This way an existing bucket costs one call, and a
 * key that cannot create buckets still works as long as the bucket is there.
 */
export async function uploadMedia(
  key: string,
  body: ArrayBuffer,
  mime: AllowedMime
): Promise<UploadResult> {
  const cfg = env();
  if (!cfg) return { ok: false, error: "storage-not-configured" };

  let res = await putObject(cfg, key, body, mime);
  if (!res) {
    return { ok: false, error: "storage-unreachable" };
  }

  if (res.status === 404 || res.status === 400) {
    const first = await res.text().catch(() => "");
    if (/bucket/i.test(first)) {
      const made = await createBucket(cfg.url, cfg.key);
      if (!made.ok) {
        console.error("[storage] createBucket", made.reason);
        return { ok: false, error: "bucket-unavailable", detail: made.reason };
      }
      res = await putObject(cfg, key, body, mime);
      if (!res) return { ok: false, error: "storage-unreachable" };
    } else {
      console.error("[storage] upload", res.status, first.slice(0, 200));
      return { ok: false, error: "upload-failed", detail: `${res.status}:${first.slice(0, 120)}` };
    }
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[storage] upload", res.status, detail.slice(0, 200));
    return {
      ok: false,
      error: "upload-failed",
      detail: `${res.status}:${detail.slice(0, 120)}`,
    };
  }

  return {
    ok: true,
    url: `${cfg.url}/storage/v1/object/public/${MEDIA_BUCKET}/${key}`,
  };
}
