"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { ChevronDown, Plus, X } from "lucide-react";
import { OwnerListbox } from "@/components/owner/OwnerField";
import { SafeImage } from "@/components/SafeImage";
import {
  AMENITIES,
  type AmenityId,
  SECTION_LABELS,
  type AmenityGroup,
} from "@/lib/amenities";
import { useI18n } from "@/lib/i18n";
import type { SeasonalPriceRuleDto } from "@/lib/ownerTypes";
import { type Room, type RoomShortKey } from "@/lib/rooms";
import { useOwner } from "@/lib/ownerStore";
import { cn, formatBaht } from "@/lib/utils";

const GROUPS: AmenityGroup[] = ["room", "bathroom", "comfort", "services"];

type RoomForm = Omit<Room, "meta" | "shortKey"> & { shortKey: RoomShortKey };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyRoom(): RoomForm {
  return {
    id: "",
    slug: "",
    shortKey: "loft",
    name: { en: "", th: "" },
    rate: 3000,
    ota: 3600,
    description: { en: "", th: "" },
    photos: [""],
    amenities: [],
    capacity: 2,
    bedType: { en: "King bed", th: "เตียงคิง" },
    sizeM2: 30,
    view: { en: "", th: "" },
    floor: { en: "", th: "" },
    bathtub: false,
    balcony: false,
    pets: false,
    active: true,
  };
}

function roomToForm(room: Room): RoomForm {
  return { ...room, photos: room.photos.length ? [...room.photos] : [""] };
}

function buildMeta(form: RoomForm): Room["meta"] {
  return {
    en: `${form.sizeM2} m² · ${form.bedType.en} · ${form.view.en}`,
    th: `${form.sizeM2} ตร.ม. · ${form.bedType.th} · ${form.view.th}`,
  };
}

type PricingDraft = {
  label: string;
  startDate: string;
  endDate: string;
  multiplier: string;
};

function emptyPricing(): PricingDraft {
  return {
    label: "",
    startDate: "",
    endDate: "",
    multiplier: "1.2",
  };
}

export default function OwnerRoomsPage() {
  const { t, tr } = useI18n();
  const { data, addRoom, updateRoom, deleteRoom } = useOwner();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyRoom);
  const [pricingOpen, setPricingOpen] = useState<string | null>(null);
  const [pricingByRoom, setPricingByRoom] = useState<
    Record<string, SeasonalPriceRuleDto[]>
  >({});
  const [pricingDraft, setPricingDraft] = useState<PricingDraft>(emptyPricing);
  const [pricingBusy, setPricingBusy] = useState(false);
  const [pricingMsg, setPricingMsg] = useState("");

  const sortedRooms = useMemo(
    () => [...data.rooms].sort((a, b) => a.name.en.localeCompare(b.name.en)),
    [data.rooms]
  );

  const loadPricing = useCallback(async (roomId: string) => {
    const res = await fetch(`/api/rooms/${roomId}/pricing`);
    if (!res.ok) return;
    const rows = (await res.json()) as SeasonalPriceRuleDto[];
    setPricingByRoom((prev) => ({ ...prev, [roomId]: rows }));
  }, []);

  useEffect(() => {
    if (!pricingOpen) return;
    void loadPricing(pricingOpen);
  }, [pricingOpen, loadPricing]);

  function openAdd() {
    setEditing(null);
    setForm(emptyRoom());
    setModalOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setForm(roomToForm(room));
    setModalOpen(true);
  }

  function toggleActive(room: Room) {
    updateRoom(room.id, { active: !room.active });
  }

  function toggleAmenity(id: AmenityId) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  }

  function updatePhoto(index: number, value: string) {
    setForm((prev) => {
      const photos = [...prev.photos];
      photos[index] = value;
      return { ...prev, photos };
    });
  }

  function addPhotoRow() {
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ""] }));
  }

  function removePhotoRow(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }

  function saveRoom() {
    const slug = form.slug.trim() || slugify(form.name.en);
    const id = editing?.id ?? slug;
    const photos = form.photos.map((p) => p.trim()).filter(Boolean);
    const payload: Room = {
      ...form,
      id,
      slug,
      photos: photos.length
        ? photos
        : ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304"],
      meta: buildMeta({ ...form, slug }),
    };

    if (editing) {
      updateRoom(editing.id, payload);
    } else {
      addRoom(payload);
    }
    setModalOpen(false);
  }

  function handleDelete(room: Room) {
    if (!window.confirm(t("ow.sure"))) return;
    deleteRoom(room.id);
  }

  function togglePricing(roomId: string) {
    setPricingMsg("");
    setPricingDraft(emptyPricing());
    setPricingOpen((prev) => (prev === roomId ? null : roomId));
  }

  async function addPriceRule(roomId: string) {
    const mult = parseFloat(pricingDraft.multiplier);
    if (
      !pricingDraft.startDate ||
      !pricingDraft.endDate ||
      !Number.isFinite(mult)
    ) {
      setPricingMsg("Start, end, and multiplier are required");
      return;
    }
    setPricingBusy(true);
    setPricingMsg("");
    try {
      const res = await fetch(`/api/rooms/${roomId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: pricingDraft.label.trim(),
          startDate: pricingDraft.startDate,
          endDate: pricingDraft.endDate,
          multiplier: mult,
        }),
      });
      if (!res.ok) {
        setPricingMsg("Could not add rule");
        return;
      }
      setPricingDraft(emptyPricing());
      await loadPricing(roomId);
      setPricingMsg("Rule added");
    } finally {
      setPricingBusy(false);
    }
  }

  async function deletePriceRule(roomId: string, ruleId: string) {
    if (!window.confirm("Delete this pricing rule?")) return;
    setPricingBusy(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/pricing?id=${ruleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setPricingMsg("Could not delete rule");
        return;
      }
      await loadPricing(roomId);
      setPricingMsg("Rule deleted");
    } finally {
      setPricingBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-white">
          {t("ow.rooms")}
        </h1>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3d8ae6]"
        >
          <Plus className="h-5 w-5" aria-hidden />
          {t("ow.addRoom")}
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {sortedRooms.map((room) => {
          const open = pricingOpen === room.id;
          const rules = pricingByRoom[room.id] ?? [];
          return (
            <article
              key={room.id}
              className={cn(
                "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition",
                !room.active && "opacity-60"
              )}
            >
              <div className="relative aspect-[4/3]">
                <SafeImage
                  src={room.photos[0] ?? ""}
                  alt={tr(room.name)}
                  fill
                  sizes="(max-width:768px) 100vw, 33vw"
                  className="object-cover"
                />
                {!room.active ? (
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white/80">
                    Inactive
                  </span>
                ) : null}
              </div>

              <div className="p-5">
                <h2 className="font-display text-xl font-semibold text-white">
                  {tr(room.name)}
                </h2>
                <p className="mt-1 text-sm text-white/50">{tr(room.meta)}</p>
                <p className="mt-3 font-display text-2xl font-semibold text-gold">
                  {formatBaht(room.rate)}
                  <span className="ml-2 text-sm font-sans font-semibold text-white/40">
                    OTA {formatBaht(room.ota)}
                  </span>
                </p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                    <span className="text-sm font-bold text-white/70">
                      {t("ow.active")}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={room.active}
                      onClick={() => toggleActive(room)}
                      className={cn(
                        "relative h-7 w-12 rounded-full transition",
                        room.active ? "bg-deal" : "bg-white/20"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
                          room.active ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(room)}
                      className="min-h-[44px] rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white"
                    >
                      {t("ow.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(room)}
                      className="min-h-[44px] rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300"
                    >
                      {t("ow.del")}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => togglePricing(room.id)}
                  className="mt-4 flex min-h-[44px] w-full items-center justify-between rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-own-blue/40"
                  aria-expanded={open}
                >
                  Seasonal pricing
                  <ChevronDown
                    className={cn("h-4 w-4 transition", open && "rotate-180")}
                    aria-hidden
                  />
                </button>

                {open ? (
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                    {rules.length === 0 ? (
                      <p className="text-xs text-white/45">No rules yet</p>
                    ) : (
                      <ul className="space-y-2">
                        {rules.map((rule) => (
                          <li
                            key={rule.id}
                            className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">
                                {rule.label || "Season"} · ×{rule.multiplier}
                              </p>
                              <p className="text-white/50">
                                {rule.startDate} to {rule.endDate}
                              </p>
                              <p className="mt-0.5 text-gold">
                                ≈{" "}
                                {formatBaht(
                                  Math.round(room.rate * rule.multiplier)
                                )}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={pricingBusy}
                              onClick={() =>
                                void deletePriceRule(room.id, rule.id)
                              }
                              className="shrink-0 text-red-300 hover:underline"
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="space-y-2">
                      <input
                        placeholder="Label (e.g. Songkran)"
                        value={pricingDraft.label}
                        onChange={(e) =>
                          setPricingDraft((p) => ({
                            ...p,
                            label: e.target.value,
                          }))
                        }
                        className="min-h-[40px] w-full px-3 py-2 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={pricingDraft.startDate}
                          onChange={(e) =>
                            setPricingDraft((p) => ({
                              ...p,
                              startDate: e.target.value,
                            }))
                          }
                          className="min-h-[40px] w-full px-3 py-2 text-sm"
                          aria-label="Start date"
                        />
                        <input
                          type="date"
                          value={pricingDraft.endDate}
                          onChange={(e) =>
                            setPricingDraft((p) => ({
                              ...p,
                              endDate: e.target.value,
                            }))
                          }
                          className="min-h-[40px] w-full px-3 py-2 text-sm"
                          aria-label="End date"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        placeholder="Multiplier"
                        value={pricingDraft.multiplier}
                        onChange={(e) =>
                          setPricingDraft((p) => ({
                            ...p,
                            multiplier: e.target.value,
                          }))
                        }
                        className="min-h-[40px] w-full px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        disabled={pricingBusy}
                        onClick={() => void addPriceRule(room.id)}
                        className="min-h-[40px] w-full rounded-xl bg-own-blue/90 px-3 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                      >
                        Add rule
                      </button>
                      {pricingMsg && pricingOpen === room.id ? (
                        <p className="text-xs font-semibold text-deal">
                          {pricingMsg}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <Transition show={modalOpen} as={Fragment}>
        <Dialog onClose={() => setModalOpen(false)} className="relative z-50">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <DialogPanel className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-brand p-6 shadow-panel">
                <div className="mb-6 flex items-center justify-between">
                  <DialogTitle className="font-display text-xl font-semibold text-white">
                    {editing ? t("ow.edit") : t("ow.addRoom")}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white/60 hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name EN">
                      <input
                        value={form.name.en}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            name: { ...p.name, en: e.target.value },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Name TH">
                      <input
                        value={form.name.th}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            name: { ...p.name, th: e.target.value },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Slug">
                    <input
                      value={form.slug}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, slug: e.target.value }))
                      }
                      placeholder={slugify(form.name.en) || "room-slug"}
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Size (m²)">
                      <input
                        type="number"
                        value={form.sizeM2}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            sizeM2: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Sleeps">
                      <input
                        type="number"
                        value={form.capacity}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            capacity: parseInt(e.target.value, 10) || 1,
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t("ow.active")}>
                      <OwnerListbox
                        value={form.active ? "yes" : "no"}
                        onChange={(v) =>
                          setForm((p) => ({ ...p, active: v === "yes" }))
                        }
                        options={[
                          { value: "yes", label: t("ow.active") },
                          { value: "no", label: "Inactive" },
                        ]}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Bed EN">
                      <input
                        value={form.bedType.en}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            bedType: { ...p.bedType, en: e.target.value },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Bed TH">
                      <input
                        value={form.bedType.th}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            bedType: { ...p.bedType, th: e.target.value },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Floor EN">
                      <input
                        value={form.floor.en}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            floor: { ...p.floor, en: e.target.value },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Floor TH">
                      <input
                        value={form.floor.th}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            floor: { ...p.floor, th: e.target.value },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="View EN">
                      <input
                        value={form.view.en}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            view: { ...p.view, en: e.target.value },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="View TH">
                      <input
                        value={form.view.th}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            view: { ...p.view, th: e.target.value },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Direct rate">
                      <input
                        type="number"
                        value={form.rate}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            rate: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="OTA rate">
                      <input
                        type="number"
                        value={form.ota}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            ota: parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div>
                    <div className="mb-3 text-sm font-semibold text-white/80">
                      Amenities
                    </div>
                    {GROUPS.map((group) => (
                      <div key={group} className="mb-4">
                        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-gold">
                          {tr(SECTION_LABELS[group])}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {Object.values(AMENITIES)
                            .filter((a) => a.group === group)
                            .map((a) => (
                              <label
                                key={a.id}
                                className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80"
                              >
                                <input
                                  type="checkbox"
                                  checked={form.amenities.includes(a.id)}
                                  onChange={() => toggleAmenity(a.id)}
                                  className="h-4 w-4 rounded accent-gold"
                                />
                                {tr({ en: a.en, th: a.th })}
                              </label>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white/80">
                        Photo URLs
                      </span>
                      <button
                        type="button"
                        onClick={addPhotoRow}
                        className="min-h-[44px] text-sm font-bold text-gold"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.photos.map((url, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={url}
                            onChange={(e) => updatePhoto(i, e.target.value)}
                            placeholder="https://..."
                            className={inputClass}
                          />
                          {form.photos.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removePhotoRow(i)}
                              className="min-h-[44px] shrink-0 rounded-xl border border-white/15 px-3 text-sm font-bold text-white/60"
                            >
                              {t("ow.del")}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Description EN">
                      <textarea
                        rows={3}
                        value={form.description.en}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            description: {
                              ...p.description,
                              en: e.target.value,
                            },
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
                            description: {
                              ...p.description,
                              th: e.target.value,
                            },
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <Checkbox
                      label="Pet friendly"
                      checked={form.pets}
                      onChange={(v) => setForm((p) => ({ ...p, pets: v }))}
                    />
                    <Checkbox
                      label="Bathtub"
                      checked={form.bathtub}
                      onChange={(v) => setForm((p) => ({ ...p, bathtub: v }))}
                    />
                    <Checkbox
                      label="Balcony"
                      checked={form.balcony}
                      onChange={(v) => setForm((p) => ({ ...p, balcony: v }))}
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="min-h-[44px] flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70"
                  >
                    {t("ow.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={saveRoom}
                    className="min-h-[44px] flex-1 rounded-xl bg-own-blue px-4 py-3 text-sm font-extrabold text-white"
                  >
                    {t("ow.save")}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
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

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm font-semibold text-white/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-gold"
      />
      {label}
    </label>
  );
}
