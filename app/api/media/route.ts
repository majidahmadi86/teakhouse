import { NextResponse } from "next/server";
import {
  MAX_UPLOAD_BYTES,
  isAllowedMime,
  mediaKey,
  storageConfigured,
  storageHost,
  uploadMedia,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Owner media upload · multipart POST with `file` and an optional `folder`.
 * The service role key lives in lib/storage and is never sent to the client;
 * this route is the only way in, and it re-checks type and size on the server
 * because the client-side downscale is a convenience, not a control.
 *
 * GET reports whether storage is wired up, so the managers can show the
 * "activate after storage setup" note instead of a control that cannot work.
 */
export async function GET() {
  return NextResponse.json({
    configured: storageConfigured(),
    // Hostname only · it is public in every media URL. Never the key.
    host: storageHost(),
  });
}

export async function POST(req: Request) {
  if (!storageConfigured()) {
    return NextResponse.json(
      { error: "storage-not-configured" },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected-multipart" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file-required" }, { status: 400 });
  }
  if (!isAllowedMime(file.type)) {
    return NextResponse.json(
      { error: "type-not-allowed", allowed: "jpg, png, webp" },
      { status: 415 }
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "too-large", maxBytes: MAX_UPLOAD_BYTES },
      { status: 413 }
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "file-empty" }, { status: 400 });
  }

  const folder = String(form.get("folder") ?? "misc");
  const result = await uploadMedia(
    mediaKey(folder, file.type),
    await file.arrayBuffer(),
    file.type
  );

  if (!result.ok) {
    const status = result.error === "storage-not-configured" ? 503 : 502;
    // `detail` carries the object store's own status and message so a
    // misconfigured bucket is diagnosable from the response. It never contains
    // the service key · that only ever goes into an Authorization header.
    return NextResponse.json(
      { error: result.error, detail: result.detail },
      { status }
    );
  }
  return NextResponse.json({ url: result.url }, { status: 201 });
}
