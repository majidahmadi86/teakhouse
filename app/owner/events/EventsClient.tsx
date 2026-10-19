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
import { ownerFetch } from "@/lib/ownerSessionClient";
import { cn, isoDate } from "@/lib/utils";
import {
  ModalActions,
  OwnerFormField,
  OwnerModal,
  useConfirm,
  useToast,
} from "@/components/owner/OwnerUI";
import { RequestsPanel } from "./RequestsPanel";
import { invalidateCached, readCached } from "@/lib/ownerCache";
import { dfLocale } from "@/lib/dateLocale";

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

// HF-1 · owner writes carry the owner session (lib/ownerSessionClient).
async function jsonFetch(url: string, init?: RequestInit): Promise<boolean> {
  try {
    const res = await ownerFetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Events manager · CRUD for special events, DB-backed like rooms. Server-first
 * mutations with a full refetch · the list is a handful of rows.
 */
export default function OwnerEventsPage() {
  const { t, tr, lang } = useI18n();
  const dfl = dfLocale(lang);
  const toast = useToast();
  const confirm = useConfirm();
  const [events, setEvents] = useState<HotelEvent[] | null>(null);
  const [baseline, setBaseline] = useState("");
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

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

  function openWith(ev: HotelEvent | null, next: EventForm) {
    setEditing(ev);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setErrors({});
    setFormError("");
    setModalOpen(true);
  }

  function openAdd() {
    openWith(null, emptyEvent());
  }

  function openEdit(ev: HotelEvent) {
    openWith(ev, {
      title: { ...ev.title },
      date: ev.date,
      description: { ...ev.description },
      image: ev.image,
      published: ev.published,
    });
  }

  async function saveEvent() {
    const found: { title?: string; date?: string } = {};
    if (!form.title.en.trim()) found.title = t("ow.v.titleEn");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) found.date = t("ow.v.date");
    setErrors(found);
    if (found.title || found.date) {
      setFormError(t("ow.v.fix"));
      return;
    }
    setFormError("");
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
    setSaving(true);
    const ok = editing
      ? await jsonFetch(`/api/events/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await jsonFetch("/api/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!ok) {
      setFormError(t("ow.ui.saveFailed"));
      return;
    }
    setBaseline(JSON.stringify(form));
    setModalOpen(false);
    toast(t("ow.ui.savedName", { name: payload.title.en }));
    await refresh(true);
  }

  async function togglePublished(ev: HotelEvent) {
    const ok = await jsonFetch(`/api/events/${ev.id}`, {
      method: "PATCH",
      body: JSON.stringify({ published: !ev.published }),
    });
    if (ok) toast(ev.published ? t("ow.ui.nowHidden", { name: tr(ev.title) }) : t("ow.ui.nowPublished", { name: tr(ev.title) }));
    else toast(t("ow.ui.saveFailed"), "error");
    await refresh(true);
  }

  async function deleteEvent(ev: HotelEvent) {
    const yes = await confirm({
      title: t("ow.ev.delTitle", { name: tr(ev.title) }),
      message: t("ow.ev.delBody"),
      confirmLabel: t("ow.del"),
      tone: "danger",
    });
    if (!yes) return;
    const ok = await jsonFetch(`/api/events/${ev.id}`, { method: "DELETE" });
    if (ok) toast(t("ow.ui.deletedName", { name: tr(ev.title) }));
    else toast(t("ow.ui.deleteFailed"), "error");
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
          {t("ow.addEvent")}
        </button>
      </div>

      <RequestsPanel />

      {events.length === 0 ? (
        <div className="owner-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-white/60">{t("ow.ev.empty")}</p>
        </div>
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
                      {t("ow.ui.hiddenFromGuests")}
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
                  {format(parseISO(ev.date), "EEE d MMM yyyy", dfl)}
                  {ev.date < todayIso ? ` · ${t("ow.ev.past")}` : ""}
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
                    aria-label={`${t("ow.published")} · ${tr(ev.title)}`}
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
        title={editing ? t("ow.edit") : t("ow.addEvent")}
        dirty={modalOpen && JSON.stringify(form) !== baseline}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.titleEn")} error={errors.title}>
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
            <Field label={t("ow.f.titleTh")}>
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
            <Field label={t("rsv.date")} tip={t("ow.tip.events.date")} error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label={t("ow.f.visibility")} tip={t("ow.tip.events.visibility")}>
              <OwnerListbox
                value={form.published ? "yes" : "no"}
                onChange={(v) =>
                  setForm((p) => ({ ...p, published: v === "yes" }))
                }
                options={[
                  { value: "yes", label: t("ow.published") },
                  { value: "no", label: t("ow.hidden") },
                ]}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.descEn")}>
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
            <Field label={t("ow.f.descTh")}>
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
            label={t("ow.f.eventImage")}
            value={form.image}
            folder="events"
            onChange={(url) => setForm((p) => ({ ...p, image: url }))}
            hint={t("ow.hint.event")}
          />
          <Field label={t("ow.f.pastePath")} tip={t("ow.tip.events.image")}>
            <input
              value={form.image}
              onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
              placeholder="https://"
              className={inputClass}
            />
          </Field>
        </div>
        <ModalActions
          onCancel={() => setModalOpen(false)}
          onSave={() => void saveEvent()}
          cancelLabel={t("ow.cancel")}
          saveLabel={saving ? t("ow.setSaving") : t("ow.save")}
          saving={saving}
          error={formError || undefined}
        />
      </OwnerModal>
    </div>
  );
}

const inputClass = "min-h-[44px] w-full px-4 py-3 text-base";

/** The owner form field with optional ? help and inline error (OwnerUI). */
const Field = OwnerFormField;
