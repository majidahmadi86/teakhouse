"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Search } from "lucide-react";
import { ImageUploadField } from "@/components/owner/ImageUploadField";
import { OwnerListbox } from "@/components/owner/OwnerField";
import {
  ModalActions,
  OwnerFormField,
  OwnerModal,
  TipLabel,
  useConfirm,
  useToast,
} from "@/components/owner/OwnerUI";
import { SafeImage } from "@/components/SafeImage";
import {
  AMENITIES,
  type AmenityId,
  SECTION_LABELS,
  type AmenityGroup,
} from "@/lib/amenities";
import { useI18n } from "@/lib/i18n";
import { type Room, type RoomShortKey } from "@/lib/rooms";
import { useOwner } from "@/lib/ownerStore";
import { SLUG_RE } from "@/lib/roomValidation";
import { cn, formatBaht } from "@/lib/utils";

const GROUPS: AmenityGroup[] = ["room", "bathroom", "comfort", "services"];

type RoomForm = Omit<Room, "meta" | "shortKey"> & { shortKey: RoomShortKey };
type RoomErrors = Partial<Record<"name" | "slug" | "rate" | "ota" | "capacity", string>>;

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
    shortKey: "king",
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

export default function OwnerRoomsPage() {
  const { t, tr } = useI18n();
  const { data, addRoom, updateRoom, deleteRoom } = useOwner();
  const toast = useToast();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyRoom);
  const [baseline, setBaseline] = useState("");
  const [errors, setErrors] = useState<RoomErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const dirty = modalOpen && JSON.stringify(form) !== baseline;

  const sortedRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.rooms]
      .filter(
        (r) =>
          !q ||
          r.name.en.toLowerCase().includes(q) ||
          r.name.th.toLowerCase().includes(q) ||
          r.slug.includes(q)
      )
      .sort((a, b) => a.name.en.localeCompare(b.name.en));
  }, [data.rooms, query]);

  /** How many rate rules each room carries · shown on the rate calendar link. */
  const ruleCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const rule of data.priceRules) {
      counts[rule.roomId] = (counts[rule.roomId] ?? 0) + 1;
    }
    return counts;
  }, [data.priceRules]);

  function openWith(next: RoomForm, room: Room | null) {
    setEditing(room);
    setForm(next);
    setBaseline(JSON.stringify(next));
    setErrors({});
    setFormError("");
    setModalOpen(true);
  }

  function openAdd() {
    openWith(emptyRoom(), null);
  }

  function openEdit(room: Room) {
    openWith(roomToForm(room), room);
  }

  function failureText(message?: string, status?: number): string {
    if (status === 0) return t("ow.ui.offline");
    return message ? `${t("ow.ui.saveFailed")} ${message}` : t("ow.ui.saveFailed");
  }

  async function toggleActive(room: Room) {
    setBusyId(room.id);
    const result = await updateRoom(room.id, { active: !room.active });
    setBusyId(null);
    if (result.ok) {
      toast(room.active ? t("ow.rm.archived", { name: tr(room.name) }) : t("ow.rm.onSale", { name: tr(room.name) }));
    } else {
      toast(failureText(result.message, result.status), "error");
    }
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

  function validate(slug: string): RoomErrors {
    const e: RoomErrors = {};
    if (!form.name.en.trim()) e.name = t("ow.v.roomName");
    if (!slug || !SLUG_RE.test(slug)) e.slug = t("ow.v.slug");
    else if (data.rooms.some((r) => r.slug === slug && r.id !== editing?.id)) e.slug = t("ow.v.slugTaken");
    if (!(form.rate > 0)) e.rate = t("ow.v.rate");
    if (!(form.ota >= 0)) e.ota = t("ow.v.ota");
    if (!(form.capacity >= 1)) e.capacity = t("ow.v.capacity");
    return e;
  }

  async function saveRoom() {
    const slug = (form.slug.trim() || slugify(form.name.en)).toLowerCase();
    const found = validate(slug);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(t("ow.v.fix"));
      return;
    }
    setFormError("");
    const id = editing?.id ?? slug;
    const photos = form.photos.map((p) => p.trim()).filter(Boolean);
    // v18 · no stock photograph stands in for a room · an empty list is
    // honest, and the panel shows a plain tile until a photo is added.
    const payload: Room = {
      ...form,
      name: { en: form.name.en.trim(), th: form.name.th.trim() || form.name.en.trim() },
      id,
      slug,
      photos,
      meta: buildMeta({ ...form, slug }),
    };

    setSaving(true);
    const result = editing ? await updateRoom(editing.id, payload) : await addRoom(payload);
    setSaving(false);
    if (!result.ok) {
      if (result.error === "slug-taken") setErrors((x) => ({ ...x, slug: t("ow.v.slugTaken") }));
      setFormError(failureText(result.message, result.status));
      return;
    }
    setBaseline(JSON.stringify(form));
    setModalOpen(false);
    toast(editing ? t("ow.rm.saved", { name: payload.name.en }) : t("ow.rm.added", { name: payload.name.en }));
  }

  async function handleDelete(room: Room) {
    const ok = await confirm({
      title: t("ow.rm.delTitle", { name: tr(room.name) }),
      message: t("ow.rm.delBody"),
      confirmLabel: t("ow.del"),
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(room.id);
    const result = await deleteRoom(room.id);
    setBusyId(null);
    if (result.ok) {
      toast(t("ow.rm.deleted", { name: tr(room.name) }));
      return;
    }
    if (result.status === 409 && result.error === "has-bookings") {
      const n = Number(result.body?.count ?? 0);
      const archive = await confirm({
        title: t("ow.rm.hasBookingsTitle"),
        message: t("ow.rm.hasBookingsBody", { n }),
        confirmLabel: room.active ? t("ow.rm.archive") : t("ow.ui.ok"),
        cancelLabel: t("ow.cancel"),
      });
      if (archive && room.active) await toggleActive(room);
      return;
    }
    toast(failureText(result.message, result.status), "error");
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

      {data.rooms.length > 0 ? (
        <div className="owner-panel mb-6 rounded-2xl p-4">
          <label className="relative block">
            <span className="sr-only">{t("ow.rm.search")}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ow.rm.search")}
              className="min-h-[44px] w-full py-3 pl-11 pr-4 text-base"
            />
          </label>
        </div>
      ) : null}

      {data.rooms.length === 0 ? (
        <div className="owner-panel rounded-2xl p-8 text-center">
          <p className="font-display text-xl font-semibold text-white">{t("ow.rm.emptyTitle")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{t("ow.rm.emptyBody")}</p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white"
          >
            <Plus className="h-5 w-5" aria-hidden />
            {t("ow.addRoom")}
          </button>
        </div>
      ) : sortedRooms.length === 0 ? (
        <p className="py-12 text-center font-semibold text-white/60">{t("ow.rm.noMatch")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedRooms.map((room) => (
            <article
              key={room.id}
              className={cn(
                "overflow-hidden owner-panel rounded-2xl transition",
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
                    {t("ow.inactive")}
                  </span>
                ) : null}
              </div>

              <div className="p-5">
                <h2 className="font-display text-xl font-semibold text-white">
                  {tr(room.name)}
                </h2>
                <p className="mt-1 text-sm text-white/60">{tr(room.meta)}</p>
                <p className="mt-3 font-display text-2xl font-semibold text-gold">
                  {formatBaht(room.rate)}
                  <span className="ml-2 font-sans text-sm font-semibold text-white/55">
                    OTA {formatBaht(room.ota)}
                  </span>
                </p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex min-h-[44px] items-center gap-3">
                    <span className="text-sm font-bold text-white/70">
                      {t("ow.active")}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={room.active}
                      aria-label={`${t("ow.active")} · ${tr(room.name)}`}
                      disabled={busyId === room.id}
                      onClick={() => void toggleActive(room)}
                      className={cn(
                        "relative h-7 w-12 rounded-full transition disabled:opacity-50",
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
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(room)}
                      className="owner-control min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold text-white"
                    >
                      {t("ow.edit")}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === room.id}
                      onClick={() => void handleDelete(room)}
                      className="min-h-[44px] rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300 disabled:opacity-50"
                    >
                      {t("ow.del")}
                    </button>
                  </div>
                </div>

                {/* Rates live in one place · the rate calendar owns seasons,
                    date overrides, and the effective price per night. */}
                <Link
                  href={`/owner/rates?room=${encodeURIComponent(room.id)}`}
                  className="owner-control mt-4 flex min-h-[44px] w-full items-center justify-between rounded-xl px-4 py-2 text-sm font-bold text-white/80 transition"
                >
                  {t("ow.rateCalendar")}
                  <span className="flex items-center gap-2 text-xs font-semibold text-white/55">
                    {ruleCount[room.id]
                      ? t("ow.ruleCount", { n: ruleCount[room.id] })
                      : t("ow.baseOnly")}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <OwnerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t("ow.edit") : t("ow.addRoom")}
        dirty={dirty}
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.nameEn")} error={errors.name}>
              <input
                value={form.name.en}
                onChange={(e) =>
                  { setForm((p) => ({ ...p, name: { ...p.name, en: e.target.value } })); setErrors((x) => ({ ...x, name: undefined, slug: undefined })); }
                }
                className={inputClass}
              />
            </Field>
            <Field label={t("ow.f.nameTh")}>
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

          <Field label={t("ow.f.slug")} tip={t("ow.tip.rooms.slug")} error={errors.slug}>
            <input
              value={form.slug}
              onChange={(e) =>
                { setForm((p) => ({ ...p, slug: e.target.value })); setErrors((x) => ({ ...x, slug: undefined })); }
              }
              placeholder={slugify(form.name.en) || "room-slug"}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("ow.f.size")} tip={t("ow.tip.rooms.size")}>
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
            <Field label={t("cmp.sleeps")} tip={t("ow.tip.rooms.capacity")} error={errors.capacity}>
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
            <Field label={t("ow.active")} tip={t("ow.tip.rooms.active")}>
              <OwnerListbox
                value={form.active ? "yes" : "no"}
                onChange={(v) =>
                  setForm((p) => ({ ...p, active: v === "yes" }))
                }
                options={[
                  { value: "yes", label: t("ow.active") },
                  { value: "no", label: t("ow.inactive") },
                ]}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.bedEn")}>
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
            <Field label={t("ow.f.bedTh")}>
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
            <Field label={t("ow.f.floorEn")}>
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
            <Field label={t("ow.f.floorTh")}>
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
            <Field label={t("ow.f.viewEn")}>
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
            <Field label={t("ow.f.viewTh")}>
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
            <Field label={t("ow.f.directRate")} tip={t("ow.tip.rooms.rate")} error={errors.rate}>
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
            <Field label={t("ow.f.otaRate")} tip={t("ow.tip.rooms.ota")} error={errors.ota}>
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
            <div className="mb-3 text-sm font-semibold text-white/80">{t("ow.rm.amenities")}</div>
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
                        className="owner-inset flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80"
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
              <span className="flex items-center gap-1.5 text-sm font-semibold text-white/80"><TipLabel label={t("ow.rm.photoUrls")} tip={t("ow.tip.rooms.photos")} /></span>
              <button
                type="button"
                onClick={addPhotoRow}
                className="min-h-[44px] text-sm font-bold text-gold"
              >{t("ow.rm.addPhoto")}</button>
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
                      className="owner-control min-h-[44px] shrink-0 rounded-xl px-3 text-sm font-bold text-white/60"
                    >
                      {t("ow.del")}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {/* v13 · upload straight into the next empty slot (or a new
                one), so the owner never has to paste a URL. */}
            <div className="mt-3">
              <ImageUploadField
                label={t("ow.f.roomPhoto")}
                value=""
                folder="rooms"
                onChange={(url) => {
                  setForm((p) => {
                    const empty = p.photos.findIndex((x) => !x.trim());
                    const photos = [...p.photos];
                    if (empty >= 0) photos[empty] = url;
                    else photos.push(url);
                    return { ...p, photos };
                  });
                }}
                hint={t("ow.hint.roomPhoto")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("ow.f.descEn")}>
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
            <Field label={t("ow.f.descTh")}>
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
              label={t("ow.f.pets")}
              checked={form.pets}
              onChange={(v) => setForm((p) => ({ ...p, pets: v }))}
            />
            <Checkbox
              label={t("cmp.bathtub")}
              checked={form.bathtub}
              onChange={(v) => setForm((p) => ({ ...p, bathtub: v }))}
            />
            <Checkbox
              label={t("cmp.balcony")}
              checked={form.balcony}
              onChange={(v) => setForm((p) => ({ ...p, balcony: v }))}
            />
          </div>
        </div>

        <ModalActions
          onCancel={() => setModalOpen(false)}
          onSave={() => void saveRoom()}
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
