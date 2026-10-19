"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { format, parseISO, type Locale } from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Download,
  Plus,
  X,
} from "lucide-react";
import { OwnerDateRange, OwnerListbox } from "@/components/owner/OwnerField";
import {
  ModalActions,
  OwnerFormField,
  OwnerModal,
  TipLabel,
  useConfirm,
  useToast,
} from "@/components/owner/OwnerUI";
import { quoteStay, type PriceRule } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";
import {
  type Booking,
  type BookingSource,
  type BookingStatus,
  useOwner,
} from "@/lib/ownerStore";
import { addDays, cn, formatBaht, isoDate, nightsBetween } from "@/lib/utils";
import { dfLocale } from "@/lib/dateLocale";

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

/** "3 Sep to 5 Sep 2026" · month names and the joining word follow the UI language. */
function formatStay(
  checkIn: string,
  checkOut: string,
  dfl?: { locale: Locale },
  to = "to"
): string {
  const a = format(parseISO(checkIn), "d MMM", dfl);
  const b = format(parseISO(checkOut), "d MMM yyyy", dfl);
  return `${a} ${to} ${b}`;
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

type SortKey = "code" | "guest" | "room" | "dates" | "source" | "amount" | "status";
type SortDir = "asc" | "desc";
type FormErrors = Partial<Record<"guest" | "dates" | "amount" | "email" | "adults", string>>;

const PAGE_SIZES = [25, 50] as const;

/** The quoted stay for the form · base rate plus the room's rate rules. */
function quoteFor(
  room: { id: string; rate: number } | undefined,
  rules: PriceRule[],
  checkIn: Date,
  checkOut: Date | undefined
): number | null {
  if (!room || !checkOut) return null;
  const inIso = isoDate(checkIn);
  const outIso = isoDate(checkOut);
  if (outIso <= inIso) return null;
  return quoteStay(room.rate, inIso, outIso, rules.filter((r) => r.roomId === room.id)).total;
}

export default function OwnerBookingsPage() {
  const { t, tr, lang } = useI18n();
  const dfl = dfLocale(lang);
  const { data, addBooking, updateBooking } = useOwner();
  const toast = useToast();
  const confirm = useConfirm();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("dates");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25);
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<BookingForm>(() =>
    emptyForm(data.rooms.filter((r) => r.active))
  );
  const [baseline, setBaseline] = useState("");
  /** The owner typed an amount · dates and room no longer overwrite it. */
  const [amountManual, setAmountManual] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [drawerNotes, setDrawerNotes] = useState("");
  const [drawerBusy, setDrawerBusy] = useState(false);

  const activeRooms = useMemo(() => data.rooms.filter((r) => r.active), [data.rooms]);
  const dirty = modalOpen && JSON.stringify(form) !== baseline;

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

  const roomOptions = useMemo(() => {
    const list = activeRooms.map((r) => ({ value: r.slug, label: tr(r.name) }));
    // An archived room stays selectable on a booking that already uses it.
    if (form.roomSlug && !list.some((o) => o.value === form.roomSlug)) {
      const archived = data.rooms.find((r) => r.slug === form.roomSlug);
      if (archived) list.push({ value: archived.slug, label: tr(archived.name) });
    }
    return list;
  }, [activeRooms, data.rooms, form.roomSlug, tr]);

  const sourceFormOptions = useMemo(
    () => SOURCES.map((s) => ({ value: s, label: s === "Booking" ? "Booking.com" : s === "Direct" ? t("ow.direct") : s })),
    [t]
  );

  const statusFormOptions = useMemo(
    () => STATUSES.map((s) => ({ value: s, label: statusLabel(t, s) })),
    [t]
  );

  const roomName = useCallback(
    (slug: string): string => {
      const room = data.rooms.find((r) => r.slug === slug);
      return room ? tr(room.name) : slug;
    },
    [data.rooms, tr]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = data.bookings.filter((b) => {
      if (sourceFilter === "Direct" && b.source !== "Direct") return false;
      if (sourceFilter === "ota" && b.source === "Direct") return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.guest.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q)
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (b: Booking): string | number => {
      switch (sortKey) {
        case "code":
          return b.code;
        case "guest":
          return b.guest.toLowerCase();
        case "room":
          return roomName(b.roomSlug).toLowerCase();
        case "source":
          return b.source;
        case "amount":
          return b.amount;
        case "status":
          return STATUSES.indexOf(b.status);
        default:
          return b.checkIn;
      }
    };
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return c * dir || b.checkIn.localeCompare(a.checkIn);
    });
  }, [data.bookings, search, sourceFilter, statusFilter, sortKey, sortDir, roomName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  useEffect(() => {
    setPage(0);
  }, [search, sourceFilter, statusFilter, pageSize]);

  // Deep link from the calendar · /owner/bookings?id=<booking id>.
  const linkedId = searchParams.get("id");
  useEffect(() => {
    if (!linkedId) return;
    const hit = data.bookings.find((b) => b.id === linkedId);
    if (hit) {
      setSelected(hit);
      setDrawerNotes(hit.notes);
      setDrawerOpen(true);
    }
  }, [linkedId, data.bookings]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "dates" || key === "amount" ? "desc" : "asc");
    }
  }

  function openForm(next: BookingForm, edit: boolean, manual: boolean) {
    setForm(next);
    setBaseline(JSON.stringify(next));
    setAmountManual(manual);
    setErrors({});
    setFormError("");
    setEditMode(edit);
    setModalOpen(true);
  }

  function openNew() {
    const next = emptyForm(activeRooms);
    const room = activeRooms.find((r) => r.slug === next.roomSlug);
    const quoted = quoteFor(room, data.priceRules, next.checkIn, next.checkOut);
    if (quoted) next.amount = quoted;
    openForm(next, false, false);
  }

  function openEdit(booking: Booking) {
    setSelected(booking);
    openForm(bookingToForm(booking), true, true);
  }

  function openDrawer(booking: Booking) {
    setSelected(booking);
    setDrawerNotes(booking.notes);
    setDrawerOpen(true);
  }

  /** Re-quote when the stay changes, unless the owner set the amount by hand. */
  function requote(next: BookingForm): BookingForm {
    if (amountManual) return next;
    const room = data.rooms.find((r) => r.slug === next.roomSlug);
    const quoted = quoteFor(room, data.priceRules, next.checkIn, next.checkOut);
    return quoted ? { ...next, amount: quoted } : next;
  }

  function handleDates(from?: Date, to?: Date) {
    setErrors((e) => ({ ...e, dates: undefined }));
    setForm((prev) => {
      if (!from) return { ...prev, checkOut: undefined };
      if (!to) return { ...prev, checkIn: from, checkOut: undefined };
      return requote({ ...prev, checkIn: from, checkOut: to });
    });
  }

  function handleRoomChange(slug: string) {
    setForm((prev) => requote({ ...prev, roomSlug: slug }));
  }

  function validate(f: BookingForm): FormErrors {
    const e: FormErrors = {};
    if (!f.guest.trim()) e.guest = t("ow.v.guest");
    if (!f.checkOut || isoDate(f.checkOut) <= isoDate(f.checkIn)) e.dates = t("ow.v.dates");
    if (!(f.amount > 0)) e.amount = t("ow.v.amount");
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = t("ow.v.email");
    if (f.adults.trim() && !(parseInt(f.adults, 10) >= 1)) e.adults = t("ow.v.adults");
    return e;
  }

  function failureText(message?: string, status?: number): string {
    if (status === 0) return t("ow.ui.offline");
    return message ? `${t("ow.ui.saveFailed")} ${message}` : t("ow.ui.saveFailed");
  }

  async function saveBooking(force = false) {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(t("ow.v.fix"));
      return;
    }
    setFormError("");
    setSaving(true);
    const payload = formToPayload(form);
    const result =
      editMode && selected
        ? await updateBooking(selected.id, payload, { force })
        : await addBooking({ id: "", code: nextCode(data.bookings), ...payload }, { force });
    setSaving(false);

    if (!result.ok && result.status === 409 && result.error === "overlap" && !force) {
      const ok = await confirm({
        title: t("ow.bk.overlapTitle"),
        message: t("ow.bk.overlapBody", { room: roomName(form.roomSlug) }),
        confirmLabel: t("ow.bk.saveAnyway"),
        cancelLabel: t("ow.ui.keepEditing"),
        tone: "danger",
      });
      if (ok) await saveBooking(true);
      return;
    }
    if (!result.ok) {
      setFormError(failureText(result.message, result.status));
      return;
    }
    if (editMode && selected) setSelected(result.data as Booking);
    setBaseline(JSON.stringify(form));
    setModalOpen(false);
    toast(editMode ? t("ow.bk.updated") : t("ow.bk.created", { code: (result.data as Booking).code }));
  }

  async function saveNotes() {
    if (!selected || drawerNotes === selected.notes) return;
    setDrawerBusy(true);
    const result = await updateBooking(selected.id, { notes: drawerNotes });
    setDrawerBusy(false);
    if (result.ok) {
      setSelected(result.data);
      toast(t("ow.bk.notesSaved"));
    } else {
      toast(failureText(result.message, result.status), "error");
    }
  }

  async function setStatus(status: BookingStatus) {
    if (!selected) return;
    setDrawerBusy(true);
    const result = await updateBooking(selected.id, { status });
    setDrawerBusy(false);
    if (result.ok) {
      setSelected(result.data);
      toast(t("ow.bk.statusSaved", { status: statusLabel(t, status) }));
    } else {
      toast(failureText(result.message, result.status), "error");
    }
  }

  async function cancelBooking() {
    if (!selected) return;
    const ok = await confirm({
      title: t("ow.bk.cancelTitle", { code: selected.code }),
      message: t("ow.bk.cancelBody", {
        guest: selected.guest,
        dates: formatStay(selected.checkIn, selected.checkOut, dfl, t("ow.msgTo")),
      }),
      confirmLabel: t("ow.cancelBk"),
      cancelLabel: t("ow.bk.keep"),
      tone: "danger",
    });
    if (!ok) return;
    setDrawerBusy(true);
    const result = await updateBooking(selected.id, { status: "cancelled" });
    setDrawerBusy(false);
    if (result.ok) {
      setSelected(result.data);
      setDrawerOpen(false);
      toast(t("ow.bk.cancelled", { code: selected.code }));
    } else {
      toast(failureText(result.message, result.status), "error");
    }
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

  const columns: { key: SortKey; label: string }[] = [
    { key: "code", label: t("col.code") },
    { key: "guest", label: t("col.guest") },
    { key: "room", label: t("col.room") },
    { key: "dates", label: t("col.dates") },
    { key: "source", label: t("col.src") },
    { key: "amount", label: t("col.amt") },
    { key: "status", label: t("col.st") },
  ];

  const quotedNow = quoteFor(
    data.rooms.find((r) => r.slug === form.roomSlug),
    data.priceRules,
    form.checkIn,
    form.checkOut
  );

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
            className="owner-control inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition"
          >
            <Download className="h-5 w-5" aria-hidden />
            {t("ow.exportCsv")}
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3d8ae6]"
          >
            <Plus className="h-5 w-5" aria-hidden />
            {t("ow.new")}
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
            aria-label={t("ow.searchph")}
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
        {/* Phones have no table header · sorting lives here instead. */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
          <OwnerListbox
            label={t("ow.bk.sortBy")}
            value={sortKey}
            onChange={(v) => setSortKey(v as SortKey)}
            options={columns.map((c) => ({ value: c.key, label: c.label }))}
          />
          <OwnerListbox
            label={t("ow.bk.order")}
            value={sortDir}
            onChange={(v) => setSortDir(v as SortDir)}
            options={[
              { value: "asc", label: t("ow.bk.asc") },
              { value: "desc", label: t("ow.bk.desc") },
            ]}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="owner-panel hidden overflow-hidden rounded-2xl  md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50">
                {columns.map((c) => {
                  const active = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                      className="px-4 py-3 text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-gold"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex min-h-[32px] items-center gap-1 uppercase tracking-[0.14em] hover:text-white"
                      >
                        {c.label}
                        {active ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center font-semibold text-white/60"
                  >
                    {data.bookings.length === 0 ? t("ow.bk.empty") : t("ow.noMatch")}
                  </td>
                </tr>
              ) : (
                pageRows.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => openDrawer(b)}
                    className="cursor-pointer transition hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-4 font-bold text-white">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer(b);
                        }}
                        className="font-bold text-white underline-offset-4 hover:underline"
                      >
                        {b.code}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-white/90">{b.guest}</td>
                    <td className="px-4 py-4 text-white/70">
                      {roomName(b.roomSlug)}
                    </td>
                    <td className="px-4 py-4 text-white/70">
                      {formatStay(b.checkIn, b.checkOut, dfl, t("ow.msgTo"))}
                    </td>
                    <td className={cn("px-4 py-4 font-bold", sourceClass(b.source))}>
                      {b.source === "Booking" ? "Booking.com" : b.source}
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
        {pageRows.length === 0 ? (
          <p className="py-12 text-center font-semibold text-white/60">
            {data.bookings.length === 0 ? t("ow.bk.empty") : t("ow.noMatch")}
          </p>
        ) : (
          pageRows.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => openDrawer(b)}
              className="owner-panel w-full rounded-2xl p-4 text-left transition hover:bg-white/[0.09]"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="font-bold text-white">{b.code}</span>
                <StatusBadge status={b.status} t={t} />
              </div>
              <p className="font-semibold text-white/90">{b.guest}</p>
              <p className="mt-1 text-sm text-white/60">
                {roomName(b.roomSlug)} · {formatStay(b.checkIn, b.checkOut, dfl, t("ow.msgTo"))}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className={cn("text-sm font-bold", sourceClass(b.source))}>
                  {b.source === "Booking" ? "Booking.com" : b.source}
                </span>
                <span className="font-bold text-white">{formatBaht(b.amount)}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-white/70">
          <span>
            {t("ow.bk.showing", {
              from: currentPage * pageSize + 1,
              to: Math.min(filtered.length, (currentPage + 1) * pageSize),
              n: filtered.length,
            })}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="owner-inset flex rounded-xl p-1" role="group" aria-label={t("ow.bk.perPage")}>
              {PAGE_SIZES.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={pageSize === n}
                  onClick={() => setPageSize(n)}
                  className={cn(
                    "min-h-[36px] min-w-[44px] rounded-lg px-2.5 text-sm font-extrabold transition",
                    pageSize === n ? "bg-own-blue text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              aria-label={t("ow.bk.prevPage")}
              className="owner-control flex h-11 w-11 items-center justify-center rounded-xl text-white/70 transition hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="min-w-[4.5rem] text-center">
              {currentPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
              aria-label={t("ow.bk.nextPage")}
              className="owner-control flex h-11 w-11 items-center justify-center rounded-xl text-white/70 transition hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {/* New / Edit */}
      <OwnerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? t("ow.bk.editTitle", { code: selected?.code ?? "" }) : t("ow.new")}
        dirty={dirty}
      >
        <div className="space-y-4">
          <OwnerFormField label={t("col.guest")} error={errors.guest}>
            <input
              value={form.guest}
              onChange={(e) => {
                setForm((p) => ({ ...p, guest: e.target.value }));
                setErrors((x) => ({ ...x, guest: undefined }));
              }}
              aria-invalid={errors.guest ? true : undefined}
              className={inputClass}
            />
          </OwnerFormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <OwnerFormField label={t("ow.passport")} tip={t("ow.tip.bookings.passport")}>
              <input
                value={form.passportId}
                onChange={(e) => setForm((p) => ({ ...p, passportId: e.target.value }))}
                className={inputClass}
              />
            </OwnerFormField>
            <OwnerFormField label={t("ow.nationality")}>
              <input
                value={form.nationality}
                onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))}
                className={inputClass}
              />
            </OwnerFormField>
            <OwnerFormField label={t("ow.phone")}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className={inputClass}
              />
            </OwnerFormField>
            <OwnerFormField label={t("ow.email")} tip={t("ow.tip.bookings.email")} error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((p) => ({ ...p, email: e.target.value }));
                  setErrors((x) => ({ ...x, email: undefined }));
                }}
                aria-invalid={errors.email ? true : undefined}
                className={inputClass}
              />
            </OwnerFormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <OwnerFormField label={t("ow.adults")} error={errors.adults}>
              <input
                type="number"
                min={1}
                value={form.adults}
                onChange={(e) => {
                  setForm((p) => ({ ...p, adults: e.target.value }));
                  setErrors((x) => ({ ...x, adults: undefined }));
                }}
                className={inputClass}
              />
            </OwnerFormField>
            <OwnerFormField label={t("ow.children")}>
              <input
                type="number"
                min={0}
                value={form.children}
                onChange={(e) => setForm((p) => ({ ...p, children: e.target.value }))}
                className={inputClass}
              />
            </OwnerFormField>
          </div>
          <OwnerFormField label={t("ow.arrival")} tip={t("ow.tip.bookings.arrival")}>
            <input
              value={form.arrivalTime}
              onChange={(e) => setForm((p) => ({ ...p, arrivalTime: e.target.value }))}
              placeholder={t("ow.bk.arrivalPh")}
              className={inputClass}
            />
          </OwnerFormField>
          <OwnerFormField label={t("ow.special")} tip={t("ow.tip.bookings.special")}>
            <textarea
              rows={2}
              value={form.specialRequests}
              onChange={(e) => setForm((p) => ({ ...p, specialRequests: e.target.value }))}
              className={textareaClass}
            />
          </OwnerFormField>
          <OwnerFormField label={t("ow.notes")} tip={t("ow.tip.bookings.notes")}>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className={textareaClass}
            />
          </OwnerFormField>

          <div className="owner-split-t pt-4">
            <OwnerListbox
              label={t("col.room")}
              value={form.roomSlug}
              onChange={handleRoomChange}
              options={roomOptions}
            />
          </div>
          <OwnerFormField label={t("col.dates")} error={errors.dates}>
            <OwnerDateRange
              from={form.checkIn}
              to={form.checkOut}
              onChange={handleDates}
            />
          </OwnerFormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <OwnerListbox
                label={t("col.src")}
                value={form.source}
                onChange={(v) => setForm((p) => ({ ...p, source: v as BookingSource }))}
                options={sourceFormOptions}
              />
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/55">
                <TipLabel label={t("ow.bk.sourceWhat")} tip={t("ow.tip.bookings.source")} />
              </p>
            </div>
            <div>
              <OwnerListbox
                label={t("col.st")}
                value={form.status}
                onChange={(v) => setForm((p) => ({ ...p, status: v as BookingStatus }))}
                options={statusFormOptions}
              />
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/55">
                <TipLabel label={t("ow.bk.statusWhat")} tip={t("ow.tip.bookings.status")} />
              </p>
            </div>
          </div>
          <OwnerFormField label={t("col.amt")} tip={t("ow.tip.bookings.amount")} error={errors.amount}>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={form.amount || ""}
              onChange={(e) => {
                setAmountManual(true);
                setForm((p) => ({ ...p, amount: parseInt(e.target.value, 10) || 0 }));
                setErrors((x) => ({ ...x, amount: undefined }));
              }}
              aria-invalid={errors.amount ? true : undefined}
              className={inputClass}
            />
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/55">
              {amountManual ? (
                <>
                  <span>{t("ow.bk.amountManual")}</span>
                  {quotedNow ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAmountManual(false);
                        setForm((p) => ({ ...p, amount: quotedNow }));
                      }}
                      className="font-bold text-gold underline-offset-4 hover:underline"
                    >
                      {t("ow.bk.useQuote", { p: formatBaht(quotedNow) })}
                    </button>
                  ) : null}
                </>
              ) : (
                <span>{t("ow.bk.amountQuoted")}</span>
              )}
            </p>
          </OwnerFormField>
        </div>

        <ModalActions
          onCancel={() => setModalOpen(false)}
          onSave={() => void saveBooking()}
          cancelLabel={t("ow.cancel")}
          saveLabel={saving ? t("ow.setSaving") : t("ow.save")}
          saving={saving}
          error={formError || undefined}
        />
      </OwnerModal>

      {/* Detail drawer */}
      <Transition show={drawerOpen} as={Fragment}>
        <Dialog onClose={() => setDrawerOpen(false)} className="relative z-modal">
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
              <DialogPanel className="own-theme flex h-full w-full max-w-md flex-col bg-brand-2 shadow-[-12px_0_40px_rgba(0,0,0,.45)]">
                {selected ? (
                  <>
                    <div className="owner-split-b flex items-center justify-between px-5 py-4">
                      <DialogTitle className="font-display text-xl font-semibold text-white">
                        {selected.code}
                      </DialogTitle>
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        aria-label={t("ow.ui.close")}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white/60 hover:bg-white/10"
                      >
                        <X className="h-5 w-5" aria-hidden />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-6">
                      <section className="mb-8">
                        <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
                          {t("ow.guestInfo")}
                        </h3>
                        <dl className="space-y-3 text-sm">
                          <DetailRow label={t("col.guest")} value={selected.guest} />
                          <DetailRow label={t("ow.passport")} value={selected.passportId} t={t} />
                          <DetailRow label={t("ow.nationality")} value={selected.nationality} t={t} />
                          <DetailRow label={t("ow.phone")} value={selected.phone} t={t} />
                          <DetailRow label={t("ow.email")} value={selected.email} t={t} />
                          <DetailRow label={t("ow.adults")} value={selected.adults} t={t} />
                          <DetailRow label={t("ow.children")} value={selected.children} t={t} />
                          <DetailRow label={t("ow.arrival")} value={selected.arrivalTime} t={t} />
                          <DetailRow label={t("ow.special")} value={selected.specialRequests} t={t} />
                        </dl>
                      </section>

                      <section className="mb-8">
                        <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
                          {t("ow.stayGroup")}
                        </h3>
                        <dl className="space-y-3 text-sm">
                          <DetailRow label={t("col.room")} value={roomName(selected.roomSlug)} />
                          <DetailRow
                            label={t("col.dates")}
                            value={formatStay(selected.checkIn, selected.checkOut, dfl, t("ow.msgTo"))}
                          />
                          <DetailRow
                            label={t("col.src")}
                            value={selected.source === "Booking" ? "Booking.com" : selected.source}
                          />
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
                          <DetailRow label={t("col.amt")} value={formatBaht(selected.amount)} />
                        </dl>
                      </section>

                      <section>
                        <label
                          htmlFor="booking-notes"
                          className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-gold"
                        >
                          <TipLabel label={t("ow.notes")} tip={t("ow.tip.bookings.notes")} />
                        </label>
                        <textarea
                          id="booking-notes"
                          rows={4}
                          value={drawerNotes}
                          onChange={(e) => setDrawerNotes(e.target.value)}
                          onBlur={() => void saveNotes()}
                          className="w-full px-4 py-3 text-sm"
                        />
                      </section>
                    </div>

                    <div className="owner-split-t space-y-2 p-5">
                      <button
                        type="button"
                        disabled={drawerBusy}
                        onClick={() => {
                          openEdit(selected);
                          setDrawerOpen(false);
                        }}
                        className="owner-control min-h-[44px] w-full rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {t("ow.edit")}
                      </button>
                      {selected.status === "ok" ? (
                        <button
                          type="button"
                          disabled={drawerBusy}
                          onClick={() => void setStatus("in")}
                          className="min-h-[44px] w-full rounded-xl bg-deal px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                        >
                          {t("ow.checkin")}
                        </button>
                      ) : null}
                      {selected.status === "in" ? (
                        <button
                          type="button"
                          disabled={drawerBusy}
                          onClick={() => void setStatus("out")}
                          className="min-h-[44px] w-full rounded-xl bg-own-blue px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                        >
                          {t("ow.checkout")}
                        </button>
                      ) : null}
                      {selected.status !== "cancelled" ? (
                        <button
                          type="button"
                          disabled={drawerBusy}
                          onClick={() => void cancelBooking()}
                          className="min-h-[44px] w-full rounded-xl border border-red-500/40 px-4 py-3 text-sm font-bold text-red-300 disabled:opacity-60"
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
