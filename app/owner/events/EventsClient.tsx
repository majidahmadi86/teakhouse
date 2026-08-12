"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { ImageUploadField } from "@/components/owner/ImageUploadField";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { OwnerSkeleton } from "@/components/owner/OwnerSkeleton";
import { SafeImage } from "@/components/SafeImage";
import type { HotelEvent } from "@/lib/events";
import { useI18n } from "@/lib/i18n";
import { cn, isoDate } from "@/lib/utils";
import { ModalActions, OwnerModal } from "../dining/DiningClient";
import { RequestsPanel } from "./RequestsPanel";
import { invalidateCached, readCached } from "@/lib/ownerCache";

type EventForm = {
  title: { en: string; th: string };
  date: string;
  description: { en: string; th: string };
  image: string;
  published: boolean;
};

function emptyEvent(): EventForm {
  return {
    title: { en: "", th: "" },
    date: isoDate(new Date()),
    description: { en: "", th: "" },
    image: "",
    published: true,
  };
}

async function jsonFetch(url: string, init?: RequestInit): Promise<boolean> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return res.ok;
}

/**
 * Events manager · CRUD for special events, DB-backed like rooms. Server-first
 * mutations with a full refetch · the list is a handful of rows.
 */
export default function OwnerEventsPage() {
  const { t, tr } = useI18n();
  const [events, setEvents] = useState<HotelEvent[] | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HotelEvent | null>(null);
  const [form, setForm] = useState<EventForm>(emptyEvent);

  const refresh = useCallback(async (fresh = false) => {
    if (fresh) invalidateCached("/api/events");
    try {
      await readCached<HotelEvent[]>("/api/events", setEvents);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openAdd() {
    setEditing(null);
    setForm(emptyEvent());
    setModalOpen(true);
  }

  function openEdit(ev: HotelEvent) {
    setEditing(ev);
    setForm({
      title: { ...ev.title },
      date: ev.date,
      description: { ...ev.description },
      image: ev.image,
      published: ev.published,
    });
    setModalOpen(true);
  }

  async function saveEvent() {
    if (!form.title.en.trim() || !form.date) return;
    const payload = {
      title: {
        en: form.title.en.trim(),
        th: form.title.th.trim() || form.title.en.trim(),
      },
      date: form.date,
      description: {
        en: form.description.en.trim(),
        th: form.description.th.trim() || form.description.en.trim(),
      },
      image: form.image.trim(),
      published: form.published,
    };
    if (editing) {
      await jsonFetch(`/api/events/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await jsonFetch("/api/events", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    setModalOpen(false);
    await refresh(true);
  }

  async function togglePublished(ev: HotelEvent) {
    await jsonFetch(`/api/events/${ev.id}`, {
      method: "PATCH",
      body: JSON.stringify({ published: !ev.published }),
    });
    await refresh(true);
  }

  async function deleteEvent(ev: HotelEvent) {
    if (!window.confirm(t("ow.sure"))) return;
    await jsonFetch(`/api/events/${ev.id}`, { method: "DELETE" });
    await refresh(true);
  }

  if (events === null) return <OwnerSkeleton />;

  const todayIso = isoDate(new Date());

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-white">
          {t("ow.events")}
        </h1>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3d8ae6]"
        >
          <Plus className="h-5 w-5" aria-hidden />
          Add event
        </button>
      </div>

      <RequestsPanel />

      {events.length === 0 ? (
        <p className="text-sm text-white/55">No events yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((ev) => (
            <article
              key={ev.id}
              className={cn(
                "owner-panel overflow-hidden rounded-2xl transition",
                !ev.published && "opacity-60"
              )}
            >
              {ev.image ? (
                <div className="relative aspect-[4/3]">
                  <SafeImage
                    src={ev.image}
                    alt={tr(ev.title)}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  {!ev.published ? (
                    <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white/80">
                      Hidden from guests
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="p-5">
                <p
                  className={cn(
                    "text-xs font-extrabold uppercase tracking-[0.14em]",
                    ev.date >= todayIso ? "text-own-blue" : "text-white/45"
                  )}
                >
                  {format(parseISO(ev.date), "EEE d MMM yyyy")}
                  {ev.date < todayIso ? " · past" : ""}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white">
                  {tr(ev.title)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {tr(ev.description)}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ev.published}
                    aria-label={ev.published ? "Published" : "Hidden"}
                    onClick={() => togglePublished(ev)}
                    className={cn(
                      "relative h-7 w-12 rounded-full transition",
                      ev.published ? "bg-deal" : "bg-white/20"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
                        ev.published ? "left-[22px]" : "left-0.5"
                      )}
                    />
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(ev)}
                      className="owner-control min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold text-white"
                    >
                      {t("ow.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(ev)}
                      className="min-h-[44px] rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300"
                    >
                      {t("ow.del")}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <OwnerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t("ow.edit") : "Add event"}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title EN">
              <input
                value={form.title.en}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    title: { ...p.title, en: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Title TH">
              <input
                value={form.title.th}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    title: { ...p.title, th: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Visibility">
              <OwnerListbox
                value={form.published ? "yes" : "no"}
                onChange={(v) =>
                  setForm((p) => ({ ...p, published: v === "yes" }))
                }
                options={[
                  { value: "yes", label: "Published" },
                  { value: "no", label: "Hidden" },
                ]}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Description EN">
              <textarea
                rows={3}
                value={form.description.en}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    description: { ...p.description, en: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Description TH">
              <textarea
                rows={3}
                value={form.description.th}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    description: { ...p.description, th: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <ImageUploadField
            label="Event image"
            value={form.image}
            folder="events"
            onChange={(url) => setForm((p) => ({ ...p, image: url }))}
            hint="Wide crop · shown on the events page card."
          />
          <Field label="Or paste an image path">
            <input
              value={form.image}
              onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
              placeholder="/images/events/pavilion-dinner-1280.webp"
              className={inputClass}
            />
          </Field>
        </div>
        <ModalActions
          onCancel={() => setModalOpen(false)}
          onSave={saveEvent}
          cancelLabel={t("ow.cancel")}
          saveLabel={t("ow.save")}
        />
      </OwnerModal>
    </div>
  );
}

const inputClass = "min-h-[44px] w-full px-4 py-3 text-base";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-white/80">{label}</div>
      {children}
    </div>
  );
}
