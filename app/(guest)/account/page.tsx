"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { SafeImage } from "@/components/SafeImage";
import { useCurrency } from "@/lib/currency";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";
import { useOwner, type Booking } from "@/lib/ownerStore";
import { cn, isoDate } from "@/lib/utils";

function canCancelFree(booking: Booking): boolean {
  if (booking.status === "cancelled") return false;
  const today = parseISO(isoDate(new Date()) + "T12:00:00");
  const checkIn = parseISO(booking.checkIn + "T12:00:00");
  return differenceInCalendarDays(checkIn, today) >= 3;
}

function statusLabel(
  status: Booking["status"],
  t: (k: string) => string
): string {
  if (status === "cancelled") return t("acc.cancelled");
  if (status === "in") return t("acc.statusIn");
  if (status === "out") return t("acc.statusOut");
  return t("acc.statusOk");
}

export default function AccountPage() {
  const { t, tr, lang } = useI18n();
  const { format } = useCurrency();
  const { user, hydrated, signOut, updateUser } = useGuestAuth();
  const { data, updateBooking } = useOwner();
  const router = useRouter();

  const [tab, setTab] = useState<"bookings" | "profile">("bookings");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/account/signin");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#profile") setTab("profile");
  }, []);

  const bookings = useMemo(() => {
    if (!user) return [];
    return data.bookings
      .filter((b) => user.bookingIds.includes(b.id))
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [user, data.bookings]);

  if (!hydrated || !user) {
    return (
      <div className="section-pad flex justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue border-t-transparent" />
      </div>
    );
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    updateUser({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCancel(id: string) {
    updateBooking(id, { status: "cancelled" });
    setConfirmId(null);
  }

  return (
    <section className="section-pad bg-cloud">
      <div className="mx-auto max-w-[800px]">
        <p className="eyebrow mb-2">{t("acc.welcome")}</p>
        <h1
          className={cn(
            "text-3xl text-ink",
            lang === "th" ? "font-th-display font-semibold" : "font-display"
          )}
        >
          {user.name}
        </h1>

        <div className="mt-8 flex gap-2">
          {(
            [
              ["bookings", "acc.myBookings"],
              ["profile", "acc.profile"],
            ] as const
          ).map(([id, key]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-bold transition",
                tab === id
                  ? "bg-blue text-white"
                  : "bg-white text-ink hover:bg-sky"
              )}
            >
              {t(key)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
            className="ml-auto rounded-full px-5 py-2.5 text-sm font-bold text-sub hover:text-ink"
          >
            {t("acc.signout")}
          </button>
        </div>

        {tab === "bookings" ? (
          <div className="mt-8 space-y-4">
            {bookings.length === 0 ? (
              <div className="rounded-[14px] bg-white p-10 text-center shadow-panel">
                <p className="font-display text-xl text-ink">
                  {t("acc.noBookings")}
                </p>
                <Link href="/book" className="btn-primary mt-6 inline-flex">
                  {t("acc.bookFirst")}
                </Link>
              </div>
            ) : (
              bookings.map((b) => {
                const room = data.rooms.find((r) => r.slug === b.roomSlug);
                const free = canCancelFree(b);
                const cancelled = b.status === "cancelled";

                return (
                  <article
                    key={b.id}
                    className="flex flex-col gap-4 rounded-[14px] bg-white p-4 shadow-panel sm:flex-row sm:items-center"
                  >
                    <div className="relative h-[90px] w-full shrink-0 overflow-hidden rounded-xl sm:h-[72px] sm:w-[96px]">
                      {room ? (
                        <SafeImage
                          src={room.photos[0]}
                          alt={tr(room.name)}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-cloud" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg text-ink">
                          {room ? tr(room.name) : b.roomSlug}
                        </h2>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold",
                            cancelled
                              ? "bg-line text-sub"
                              : "bg-deal-bg text-deal"
                          )}
                        >
                          {statusLabel(b.status, t)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-sub">
                        {b.checkIn} → {b.checkOut}
                      </p>
                      <p className="mt-0.5 text-sm text-sub">
                        {b.code} · {format(b.amount)}
                      </p>
                      {!cancelled ? (
                        <p className="mt-1 text-xs font-semibold text-sub">
                          {t("acc.freeCancel")}
                        </p>
                      ) : null}
                    </div>
                    {!cancelled ? (
                      <button
                        type="button"
                        disabled={!free}
                        onClick={() => setConfirmId(b.id)}
                        className="shrink-0 rounded-full border border-line px-4 py-2.5 text-sm font-bold text-ink transition hover:border-coral-deep hover:text-coral-deep disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t("acc.cancelBooking")}
                      </button>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSaveProfile}
            className="mt-8 space-y-4 rounded-[14px] bg-white p-8 shadow-panel"
          >
            <label className="block">
              <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">
                {t("acc.name")}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">
                {t("acc.email")}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </label>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary">
                {t("acc.saveProfile")}
              </button>
              {saved ? (
                <span className="text-sm font-bold text-deal">{t("acc.saved")}</span>
              ) : null}
            </div>
          </form>
        )}
      </div>

      {confirmId ? (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-base font-semibold text-ink">
              {t("acc.cancelConfirm")}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => handleCancel(confirmId)}
                className="flex-1 rounded-full bg-coral-deep px-4 py-3 text-sm font-bold text-white"
              >
                {t("acc.cancelYes")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-full border border-line px-4 py-3 text-sm font-bold text-ink"
              >
                {t("acc.cancelNo")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-line bg-white px-4 py-3 text-sm font-semibold text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";
