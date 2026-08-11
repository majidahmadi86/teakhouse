"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { format, parseISO } from "date-fns";
import { Download, Plus, X } from "lucide-react";
import { OwnerDateRange, OwnerListbox } from "@/components/owner/OwnerField";
import { useI18n } from "@/lib/i18n";
import {
  type Booking,
  type BookingSource,
  type BookingStatus,
  useOwner,
} from "@/lib/ownerStore";
import { addDays, cn, formatBaht, isoDate, nightsBetween } from "@/lib/utils";

function csvEscape(value: string | number | undefined | null): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function bookingsToCsv(
  bookings: Booking[],
  roomName: (slug: string) => string
): string {
  const header = [
    "code",
    "guest",
    "email",
    "phone",
    "room",
    "checkIn",
    "checkOut",
    "source",
    "amount",
    "status",
    "passportId",
    "nationality",
    "adults",
    "children",
    "arrivalTime",
    "specialRequests",
    "notes",
  ];
  const rows = bookings.map((b) =>
    [
      b.code,
      b.guest,
      b.email,
      b.phone,
      roomName(b.roomSlug),
      b.checkIn,
      b.checkOut,
      b.source,
      b.amount,
      b.status,
      b.passportId,
      b.nationality,
      b.adults,
      b.children,
      b.arrivalTime,
      b.specialRequests,
      b.notes,
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

const STATUSES: BookingStatus[] = ["ok", "in", "out", "cancelled"];
const SOURCES: BookingSource[] = ["Direct", "Agoda", "Booking"];

function statusLabel(t: (k: string) => string, status: BookingStatus): string {
  return t(`ow.st.${status}`);
}

function statusClass(status: BookingStatus): string {
  if (status === "in") return "bg-own-blue/20 text-own-blue";
  if (status === "ok") return "bg-deal/20 text-deal";
  if (status === "out") return "bg-white/10 text-white/60";
  return "bg-red-500/20 text-red-300";
}

function sourceClass(source: BookingSource): string {
  return source === "Direct" ? "text-deal" : "text-gold";
}

function formatStay(checkIn: string, checkOut: string): string {
  const a = format(parseISO(checkIn), "d MMM");
  const b = format(parseISO(checkOut), "d MMM yyyy");
  return `${a} to ${b}`;
}

function nextCode(bookings: Booking[]): string {
  const nums = bookings
    .map((b) => {
      const m = b.code.match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length ? Math.max(...nums) + 1 : 4272;
  return `TKH-${next}`;
}

type BookingForm = {
  guest: string;
  passportId: string;
  nationality: string;
  phone: string;
  email: string;
  adults: string;
  children: string;
  arrivalTime: string;
  specialRequests: string;
  notes: string;
  roomSlug: string;
  checkIn: Date;
  checkOut: Date | undefined;
  source: BookingSource;
  amount: number;
  status: BookingStatus;
};

function emptyForm(rooms: { slug: string; rate: number }[]): BookingForm {
  const inDate = addDays(new Date(), 1);
  const outDate = addDays(inDate, 2);
  const slug = rooms[0]?.slug ?? "river-loft";
  const rate = rooms[0]?.rate ?? 3000;
  return {
    guest: "",
    passportId: "",
    nationality: "",
    phone: "",
    email: "",
    adults: "2",
    children: "0",
    arrivalTime: "",
    specialRequests: "",
    notes: "",
    roomSlug: slug,
    checkIn: inDate,
    checkOut: outDate,
    source: "Direct",
    amount: rate * nightsBetween(isoDate(inDate), isoDate(outDate)),
    status: "ok",
  };
}

function bookingToForm(booking: Booking): BookingForm {
  return {
    guest: booking.guest,
    passportId: booking.passportId ?? "",
    nationality: booking.nationality ?? "",
    phone: booking.phone,
    email: booking.email,
    adults: booking.adults != null ? String(booking.adults) : "",
    children: booking.children != null ? String(booking.children) : "",
    arrivalTime: booking.arrivalTime ?? "",
    specialRequests: booking.specialRequests ?? "",
    notes: booking.notes,
    roomSlug: booking.roomSlug,
    checkIn: parseISO(booking.checkIn),
    checkOut: parseISO(booking.checkOut),
    source: booking.source,
    amount: booking.amount,
    status: booking.status,
  };
}

function formToPayload(form: BookingForm) {
  const adults = form.adults.trim() ? parseInt(form.adults, 10) : undefined;
  const children = form.children.trim() ? parseInt(form.children, 10) : undefined;
  const checkOut = form.checkOut ?? addDays(form.checkIn, 1);

  return {
    guest: form.guest.trim(),
    passportId: form.passportId.trim() || undefined,
    nationality: form.nationality.trim() || undefined,
    phone: form.phone.trim(),
    email: form.email.trim(),
    adults: Number.isFinite(adults) ? adults : undefined,
    children: Number.isFinite(children) ? children : undefined,
    arrivalTime: form.arrivalTime.trim() || undefined,
    specialRequests: form.specialRequests.trim() || undefined,
    notes: form.notes,
    roomSlug: form.roomSlug,
    checkIn: isoDate(form.checkIn),
    checkOut: isoDate(checkOut),
    source: form.source,
    amount: form.amount,
    status: form.status,
  };
}

export default function OwnerBookingsPage() {
  const { t, tr } = useI18n();
  const { data, addBooking, updateBooking } = useOwner();

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<BookingForm>(() =>
    emptyForm(data.rooms.filter((r) => r.active))
  );
  const [drawerNotes, setDrawerNotes] = useState("");

  const activeRooms = data.rooms.filter((r) => r.active);

  const sourceOptions = useMemo(
    () => [
      { value: "all", label: t("ow.all") },
      { value: "Direct", label: t("ow.direct") },
      { value: "ota", label: t("ow.ota") },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("ow.allStatus") },
      ...STATUSES.map((s) => ({ value: s, label: statusLabel(t, s) })),
    ],
    [t]
  );

  const roomOptions = useMemo(
    () =>
      activeRooms.map((r) => ({
        value: r.slug,
        label: tr(r.name),
      })),
    [activeRooms, tr]
  );

  const sourceFormOptions = useMemo(
    () => SOURCES.map((s) => ({ value: s, label: s })),
    []
  );

  const statusFormOptions = useMemo(
    () => STATUSES.map((s) => ({ value: s, label: statusLabel(t, s) })),
    [t]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.bookings
      .filter((b) => {
        if (sourceFilter === "Direct" && b.source !== "Direct") return false;
        if (sourceFilter === "ota" && b.source === "Direct") return false;
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (!q) return true;
        return (
          b.guest.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [data.bookings, search, sourceFilter, statusFilter]);

  function roomName(slug: string): string {
    const room = data.rooms.find((r) => r.slug === slug);
    return room ? tr(room.name) : slug;
  }

  function openNew() {
    setForm(emptyForm(activeRooms));
    setEditMode(false);
    setModalOpen(true);
  }

  function openEdit(booking: Booking) {
    setForm(bookingToForm(booking));
    setEditMode(true);
    setSelected(booking);
    setModalOpen(true);
  }

  function openDrawer(booking: Booking) {
    setSelected(booking);
    setDrawerNotes(booking.notes);
    setDrawerOpen(true);
  }

  function handleDates(from?: Date, to?: Date) {
    setForm((prev) => {
      const room = activeRooms.find((r) => r.slug === prev.roomSlug);
      if (!from) {
        return { ...prev, checkIn: prev.checkIn, checkOut: undefined };
      }
      if (!to) {
        return { ...prev, checkIn: from, checkOut: undefined };
      }
      const nights = nightsBetween(isoDate(from), isoDate(to));
      return {
        ...prev,
        checkIn: from,
        checkOut: to,
        amount: room ? room.rate * nights : prev.amount,
      };
    });
  }

  function handleRoomChange(slug: string) {
    setForm((prev) => {
      const room = activeRooms.find((r) => r.slug === slug);
      if (!prev.checkOut) {
        return { ...prev, roomSlug: slug };
      }
      const nights = nightsBetween(
        isoDate(prev.checkIn),
        isoDate(prev.checkOut)
      );
      return {
        ...prev,
        roomSlug: slug,
        amount: room ? room.rate * nights : prev.amount,
      };
    });
  }

  function saveBooking() {
    if (!form.guest.trim() || !form.checkOut) return;

    const payload = formToPayload(form);

    if (editMode && selected) {
      updateBooking(selected.id, payload);
      setSelected({ ...selected, ...payload });
    } else {
      addBooking({
        id: `bk-${Date.now()}`,
        code: nextCode(data.bookings),
        ...payload,
      });
    }

    setModalOpen(false);
  }

  function saveNotes() {
    if (!selected) return;
    updateBooking(selected.id, { notes: drawerNotes });
    setSelected({ ...selected, notes: drawerNotes });
  }

  function setStatus(status: BookingStatus) {
    if (!selected) return;
    updateBooking(selected.id, { status });
    setSelected({ ...selected, status });
  }

  function cancelBooking() {
    if (!selected) return;
    if (!window.confirm(t("ow.sure"))) return;
    updateBooking(selected.id, { status: "cancelled" });
    setSelected({ ...selected, status: "cancelled" });
    setDrawerOpen(false);
  }

  function exportCsv() {
    const csv = bookingsToCsv(filtered, roomName);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teakhouse-bookings-${isoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-white">
          {t("ow.bk")}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-own-blue/40"
          >
            <Download className="h-5 w-5" aria-hidden />
            Export CSV
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3d8ae6]"
          >
            <Plus className="h-5 w-5" aria-hidden />+ {t("ow.new")}
          </button>
        </div>
      </div>

      <div className="owner-panel mb-6 rounded-2xl  p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("ow.searchph")}
            className="min-h-[44px] w-full px-4 py-3 text-base"
          />
          <OwnerListbox
            value={sourceFilter}
            onChange={setSourceFilter}
            options={sourceOptions}
          />
          <OwnerListbox
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="owner-panel hidden overflow-hidden rounded-2xl  md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                {[t("col.code"), t("col.guest"), t("col.room"), t("col.dates"), t("col.src"), t("col.amt"), t("col.st")].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-gold"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center font-semibold text-white/60"
                  >
                    {t("ow.noMatch")}
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => openDrawer(b)}
                    className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-4 font-bold text-white">{b.code}</td>
                    <td className="px-4 py-4 text-white/90">{b.guest}</td>
                    <td className="px-4 py-4 text-white/70">
                      {roomName(b.roomSlug)}
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      {formatStay(b.checkIn, b.checkOut)}
                    </td>
                    <td className={cn("px-4 py-4 font-bold", sourceClass(b.source))}>
                      {b.source}
                    </td>
                    <td className="px-4 py-4 font-bold text-white">
                      {formatBaht(b.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={b.status} t={t} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <p className="py-12 text-center font-semibold text-white/60">
            {t("ow.noMatch")}
          </p>
        ) : (
          filtered.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => openDrawer(b)}
              className="w-full owner-panel rounded-2xl p-4 text-left transition hover:border-gold/30"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="font-bold text-white">{b.code}</span>
                <StatusBadge status={b.status} t={t} />
              </div>
              <p className="font-semibold text-white/90">{b.guest}</p>
              <p className="mt-1 text-sm text-white/60">
                {roomName(b.roomSlug)} · {formatStay(b.checkIn, b.checkOut)}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className={cn("text-sm font-bold", sourceClass(b.source))}>
                  {b.source}
                </span>
                <span className="font-bold text-white">{formatBaht(b.amount)}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* New / Edit modal */}
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
              <DialogPanel className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-brand p-6 shadow-panel">
                <div className="mb-6 flex items-center justify-between">
                  <DialogTitle className="font-display text-xl font-semibold text-white">
                    {editMode ? t("ow.edit") : t("ow.new")}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <Field label={t("col.guest")}>
                    <input
                      value={form.guest}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, guest: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("ow.passport")}>
                    <input
                      value={form.passportId}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, passportId: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("ow.nationality")}>
                    <input
                      value={form.nationality}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, nationality: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("ow.phone")}>
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("ow.email")}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label={t("ow.adults")}>
                      <input
                        type="number"
                        min={0}
                        value={form.adults}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, adults: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t("ow.children")}>
                      <input
                        type="number"
                        min={0}
                        value={form.children}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, children: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label={t("ow.arrival")}>
                    <input
                      value={form.arrivalTime}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, arrivalTime: e.target.value }))
                      }
                      placeholder="e.g. 22:30"
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("ow.special")}>
                    <textarea
                      rows={2}
                      value={form.specialRequests}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          specialRequests: e.target.value,
                        }))
                      }
                      className={textareaClass}
                    />
                  </Field>
                  <Field label={t("ow.notes")}>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, notes: e.target.value }))
                      }
                      className={textareaClass}
                    />
                  </Field>

                  <div className="border-t border-white/10 pt-4">
                    <OwnerListbox
                      label={t("col.room")}
                      value={form.roomSlug}
                      onChange={handleRoomChange}
                      options={roomOptions}
                    />
                  </div>
                  <Field label={t("col.dates")}>
                    <OwnerDateRange
                      from={form.checkIn}
                      to={form.checkOut}
                      onChange={handleDates}
                    />
                  </Field>
                  <OwnerListbox
                    label={t("col.src")}
                    value={form.source}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, source: v as BookingSource }))
                    }
                    options={sourceFormOptions}
                  />
                  <Field label={t("col.amt")}>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          amount: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>
                  <OwnerListbox
                    label={t("col.st")}
                    value={form.status}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, status: v as BookingStatus }))
                    }
                    options={statusFormOptions}
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="min-h-[44px] flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70"
                  >
                    {t("ow.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={saveBooking}
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

      {/* Detail drawer */}
      <Transition show={drawerOpen} as={Fragment}>
        <Dialog onClose={() => setDrawerOpen(false)} className="relative z-50">
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

          <div className="fixed inset-0 flex justify-end">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-250"
              enterFrom="opacity-0 translate-x-full"
              enterTo="opacity-100 translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="opacity-0 translate-x-full"
            >
              <DialogPanel className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-brand-2 shadow-panel">
                {selected ? (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                      <DialogTitle className="font-display text-xl font-semibold text-white">
                        {selected.code}
                      </DialogTitle>
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white/60 hover:bg-white/10"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-6">
                      <section className="mb-8">
                        <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
                          {t("ow.guestInfo")}
                        </h3>
                        <dl className="space-y-3 text-sm">
                          <DetailRow label={t("col.guest")} value={selected.guest} />
                          <DetailRow
                            label={t("ow.passport")}
                            value={selected.passportId}
                            t={t}
                          />
                          <DetailRow
                            label={t("ow.nationality")}
                            value={selected.nationality}
                            t={t}
                          />
                          <DetailRow
                            label={t("ow.phone")}
                            value={selected.phone}
                            t={t}
                          />
                          <DetailRow
                            label={t("ow.email")}
                            value={selected.email}
                            t={t}
                          />
                          <DetailRow
                            label={t("ow.adults")}
                            value={selected.adults}
                            t={t}
                          />
                          <DetailRow
                            label={t("ow.children")}
                            value={selected.children}
                            t={t}
                          />
                          <DetailRow
                            label={t("ow.arrival")}
                            value={selected.arrivalTime}
                            t={t}
                          />
                          <DetailRow
                            label={t("ow.special")}
                            value={selected.specialRequests}
                            t={t}
                          />
                        </dl>
                      </section>

                      <section className="mb-8">
                        <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
                          {t("ow.stayGroup")}
                        </h3>
                        <dl className="space-y-3 text-sm">
                          <DetailRow
                            label={t("col.room")}
                            value={roomName(selected.roomSlug)}
                          />
                          <DetailRow
                            label={t("col.dates")}
                            value={formatStay(selected.checkIn, selected.checkOut)}
                          />
                          <DetailRow label={t("col.src")} value={selected.source} />
                          <div className="flex items-center gap-3">
                            <dt className="text-white/60">{t("col.st")}</dt>
                            <dd>
                              <StatusBadge status={selected.status} t={t} />
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <section className="mb-8">
                        <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
                          {t("ow.payGroup")}
                        </h3>
                        <dl className="space-y-3 text-sm">
                          <DetailRow
                            label={t("col.amt")}
                            value={formatBaht(selected.amount)}
                          />
                        </dl>
                      </section>

                      <section>
                        <label
                          htmlFor="booking-notes"
                          className="mb-3 block text-xs font-extrabold uppercase tracking-[0.14em] text-gold"
                        >
                          {t("ow.notes")}
                        </label>
                        <textarea
                          id="booking-notes"
                          rows={4}
                          value={drawerNotes}
                          onChange={(e) => setDrawerNotes(e.target.value)}
                          onBlur={saveNotes}
                          className="w-full px-4 py-3 text-sm"
                        />
                      </section>
                    </div>

                    <div className="space-y-2 border-t border-white/10 p-5">
                      <button
                        type="button"
                        onClick={() => {
                          openEdit(selected);
                          setDrawerOpen(false);
                        }}
                        className="min-h-[44px] w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white"
                      >
                        {t("ow.edit")}
                      </button>
                      {selected.status === "ok" ? (
                        <button
                          type="button"
                          onClick={() => setStatus("in")}
                          className="min-h-[44px] w-full rounded-xl bg-deal px-4 py-3 text-sm font-extrabold text-white"
                        >
                          {t("ow.checkin")}
                        </button>
                      ) : null}
                      {selected.status === "in" ? (
                        <button
                          type="button"
                          onClick={() => setStatus("out")}
                          className="min-h-[44px] w-full rounded-xl bg-own-blue px-4 py-3 text-sm font-extrabold text-white"
                        >
                          {t("ow.checkout")}
                        </button>
                      ) : null}
                      {selected.status !== "cancelled" ? (
                        <button
                          type="button"
                          onClick={cancelBooking}
                          className="min-h-[44px] w-full rounded-xl border border-red-500/40 px-4 py-3 text-sm font-bold text-red-300"
                        >
                          {t("ow.cancelBk")}
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

const inputClass = "min-h-[44px] w-full px-4 py-3 text-base";

const textareaClass = "w-full px-4 py-3 text-base";

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

function DetailRow({
  label,
  value,
  t,
}: {
  label: string;
  value?: string | number | null;
  t?: (k: string) => string;
}) {
  const missing =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "");

  const display = missing
    ? t?.("ow.notRecorded") ?? "Not recorded"
    : String(value);

  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/60">{label}</dt>
      <dd
        className={cn(
          "text-right font-semibold",
          missing ? "text-white/55 italic" : "text-white"
        )}
      >
        {display}
      </dd>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: BookingStatus;
  t: (k: string) => string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-1 text-xs font-extrabold",
        statusClass(status)
      )}
    >
      {statusLabel(t, status)}
    </span>
  );
}
