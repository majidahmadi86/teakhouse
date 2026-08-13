"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAX_EDGE = 2000;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Storage readiness · asked once per page and shared by every field, so ten
 * upload controls do not make ten identical probes.
 */
let configuredPromise: Promise<boolean> | null = null;
function storageReady(): Promise<boolean> {
  if (!configuredPromise) {
    configuredPromise = fetch("/api/media")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((j: { configured?: boolean }) => Boolean(j.configured))
      .catch(() => false);
  }
  return configuredPromise;
}

/**
 * Downscale to MAX_EDGE before upload · a phone photo is 4000px and 6MB, and
 * nothing on the site renders wider than 1280. Re-encodes to JPEG unless the
 * source is a PNG small enough to keep (transparency is worth preserving).
 * Falls back to the original file if canvas encoding is unavailable.
 */
async function prepare(file: File): Promise<File> {
  if (typeof document === "undefined") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const keepPng = file.type === "image/png";
  const mime = keepPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, keepPng ? undefined : 0.86)
  );
  if (!blob) return file;
  const ext = keepPng ? "png" : "jpg";
  return new File([blob], `upload.${ext}`, { type: mime });
}

export function ImageUploadField({
  label,
  value,
  folder,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const { t } = useI18n();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void storageReady().then((ok) => {
      if (alive) setConfigured(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  const pick = useCallback(async (file: File) => {
    setError("");
    if (!ALLOWED.includes(file.type)) {
      setError(t("ow.uploadType"));
      return;
    }
    setBusy(true);
    try {
      const prepared = await prepare(file);
      if (prepared.size > MAX_BYTES) {
        setError(t("ow.uploadBig"));
        return;
      }
      const body = new FormData();
      body.append("file", prepared);
      body.append("folder", folder);
      const res = await fetch("/api/media", { method: "POST", body });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          j.error === "storage-not-configured"
            ? t("ow.uploadNote")
            : t("ow.uploadFailed")
        );
        return;
      }
      const { url } = (await res.json()) as { url: string };
      onChange(url);
    } catch {
      setError(t("ow.uploadFailed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [folder, onChange, t]);

  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-white/80">{label}</div>

      {value ? (
        <div className="owner-inset mb-3 flex items-center gap-3 rounded-xl p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-16 w-24 shrink-0 rounded-lg object-cover"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-white/55">{value}</p>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t("ow.uploadRemove")}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-red-300 transition hover:bg-white/5"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {configured === false ? (
        <p className="owner-inset rounded-xl px-4 py-3 text-xs font-semibold text-white/55">
          {t("ow.uploadNote")}
        </p>
      ) : (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id={`upload-${folder}-${label.replace(/\W+/g, "")}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void pick(file);
            }}
          />
          <label
            htmlFor={`upload-${folder}-${label.replace(/\W+/g, "")}`}
            className={cn(
              "owner-control inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition",
              (busy || configured === null) && "pointer-events-none opacity-60"
            )}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ImageUp className="h-4 w-4" aria-hidden />
            )}
            {busy
              ? t("ow.uploading")
              : value
                ? t("ow.replaceBtn")
                : t("ow.uploadBtn")}
          </label>
        </>
      )}

      {hint ? <p className="mt-2 text-xs text-white/45">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
