/**
 * Supabase upload round-trip · owner uploads a photo, guest sees it.
 *
 * Runs against PRODUCTION by default, because the Supabase service-role key
 * only exists there · locally /api/media answers 503 and the whole path is
 * untestable. Covers the three surfaces an owner actually uploads to: a dish
 * thumbnail, an event image and a room photo.
 *
 * For each one:
 *   1 upload a real image through /api/media (the only way in · the key never
 *     reaches the client)
 *   2 confirm the returned public URL serves the bytes back
 *   3 attach it to the record through the owner API
 *   4 confirm it appears in the guest-facing payload
 *   5 confirm it is still there on a second read (it survives a reload)
 *   6 put the original value back, so a verification run leaves the demo
 *     exactly as it found it
 *
 *   node scripts/upload-roundtrip.js
 *   BASE=http://localhost:3000 node scripts/upload-roundtrip.js
 */

const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "https://teakhouse.mikaro.studio";

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} · ${name}${detail ? " · " + detail : ""}`);
}

const j = (url, init) => fetch(url, init).then(async (r) => ({
  ok: r.ok,
  status: r.status,
  body: await r.json().catch(() => null),
}));

/**
 * A real JPEG from the repo · uploading actual photography rather than a
 * generated pixel means the round trip exercises the same sizes and mime the
 * owner panel sends, and anything left behind still looks like the demo.
 */
function pickImage() {
  const candidates = [
    "public/images/contact-hero.jpg",
    "public/hero-lcp-640.avif",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && c.endsWith(".jpg")) return c;
  }
  return null;
}

async function upload(file, folder) {
  const buf = fs.readFileSync(file);
  const form = new FormData();
  form.append(
    "file",
    new File([buf], path.basename(file), { type: "image/jpeg" })
  );
  form.append("folder", folder);
  const res = await fetch(`${BASE}/api/media`, { method: "POST", body: form });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, url: body?.url, body };
}

async function roundTrip({ label, folder, listUrl, pickRecord, patchUrl, readBack }) {
  const file = pickImage();
  if (!file) {
    check(`${label} · a source image exists in the repo`, false, "no jpg found");
    return;
  }

  const list = await j(listUrl);
  const record = pickRecord(list.body);
  if (!record) {
    check(`${label} · a record to attach to`, false, `${listUrl} returned nothing usable`);
    return;
  }
  const original = record.image ?? "";

  const up = await upload(file, folder);
  check(
    `${label} · upload returns a public URL`,
    up.ok && typeof up.url === "string" && up.url.startsWith("http"),
    up.ok ? up.url : `status=${up.status} ${JSON.stringify(up.body).slice(0, 90)}`
  );
  if (!up.url) return;

  // The bytes must actually be fetchable · a URL that 404s is not an upload.
  const head = await fetch(up.url);
  const bytes = head.ok ? (await head.arrayBuffer()).byteLength : 0;
  check(
    `${label} · the uploaded file serves back over HTTP`,
    head.ok && bytes > 1000,
    `${head.status} · ${bytes} bytes · ${head.headers.get("content-type")}`
  );

  const patched = await j(patchUrl(record.id), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: up.url }),
  });
  check(`${label} · owner PATCH stores the URL`, patched.ok, `status=${patched.status}`);

  const after = await readBack(record.id);
  check(
    `${label} · the guest payload carries the new image`,
    after === up.url,
    after ? after.slice(0, 80) : "(empty)"
  );

  // Read it a second time · this is the "survives a reload" half. The guest
  // routes are cached behind revalidate tags, so a stale read here would mean
  // an owner's upload is invisible until the cache expires.
  const again = await readBack(record.id);
  check(`${label} · still there on a second read`, again === up.url);

  const restored = await j(patchUrl(record.id), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: original }),
  });
  check(
    `${label} · original value restored`,
    restored.ok && (await readBack(record.id)) === original,
    original ? "back to the seeded art" : "back to empty (seeded fallback)"
  );
}

async function main() {
  const cfg = await j(`${BASE}/api/media`);
  check(
    "storage is configured on this deployment",
    cfg.body?.configured === true,
    `host=${cfg.body?.host ?? "none"}`
  );
  if (!cfg.body?.configured) {
    console.log(
      "\nstorage is not wired up here · run this against production, where the " +
        "service-role key lives"
    );
    process.exitCode = 1;
    return;
  }

  // ── dish thumbnail ───────────────────────────────────────────────────────
  await roundTrip({
    label: "dish photo",
    folder: "dining",
    listUrl: `${BASE}/api/dining`,
    pickRecord: (menu) => (menu || []).flatMap((c) => c.items || [])[0],
    patchUrl: (id) => `${BASE}/api/dining/items/${id}`,
    readBack: async (id) => {
      const menu = await j(`${BASE}/api/dining`);
      const item = (menu.body || []).flatMap((c) => c.items || []).find((i) => i.id === id);
      return item?.image ?? null;
    },
  });

  // ── event image ──────────────────────────────────────────────────────────
  await roundTrip({
    label: "event image",
    folder: "events",
    listUrl: `${BASE}/api/events`,
    pickRecord: (events) => (events || [])[0],
    patchUrl: (id) => `${BASE}/api/events/${id}`,
    readBack: async (id) => {
      const list = await j(`${BASE}/api/events`);
      return (list.body || []).find((e) => e.id === id)?.image ?? null;
    },
  });

  // ── room photo ───────────────────────────────────────────────────────────
  // Rooms hold an array of photos rather than a single image, so this one
  // prepends the upload and restores the whole array.
  {
    const file = pickImage();
    const rooms = await j(`${BASE}/api/rooms`);
    const room = (rooms.body || [])[0];
    if (!room || !file) {
      check("room photo · a room to attach to", false, "no room or no source image");
    } else {
      const originalPhotos = Array.isArray(room.photos) ? room.photos : [];
      const up = await upload(file, "rooms");
      check(
        "room photo · upload returns a public URL",
        up.ok && !!up.url,
        up.ok ? up.url : `status=${up.status}`
      );
      if (up.url) {
        const head = await fetch(up.url);
        check(
          "room photo · the uploaded file serves back over HTTP",
          head.ok,
          `${head.status} ${head.headers.get("content-type")}`
        );
        const patched = await j(`${BASE}/api/rooms/${room.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ photos: [up.url, ...originalPhotos] }),
        });
        check("room photo · owner PATCH stores the photo", patched.ok, `status=${patched.status}`);

        const read = async () => {
          const list = await j(`${BASE}/api/rooms`);
          const r = (list.body || []).find((x) => x.id === room.id);
          return Array.isArray(r?.photos) ? r.photos[0] : null;
        };
        check("room photo · the guest payload carries the new photo", (await read()) === up.url);
        check("room photo · still there on a second read", (await read()) === up.url);

        await j(`${BASE}/api/rooms/${room.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ photos: originalPhotos }),
        });
        check(
          "room photo · original photo list restored",
          (await read()) === (originalPhotos[0] ?? null),
          `${originalPhotos.length} photos`
        );
      }
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("FAILURES:");
    failed.forEach((f) => console.log(" ·", f.name, f.detail));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
