"use client";

import { useCallback, useEffect, useState } from "react";
import {
  OwnerFormField,
  useDirtyGuard,
  useToast,
} from "@/components/owner/OwnerUI";
import { useI18n } from "@/lib/i18n";
import { ownerFetch } from "@/lib/ownerSessionClient";
import type { EmailTemplateDto, HotelDto } from "@/lib/ownerTypes";

const PLACEHOLDERS = [
  "{{guestName}}",
  "{{hotelName}}",
  "{{code}}",
  "{{roomName}}",
  "{{checkIn}}",
  "{{checkOut}}",
  "{{checkInTime}}",
  "{{checkOutTime}}",
  "{{guests}}",
  "{{amount}}",
  "{{deposit}}",
  "{{depositPct}}",
  "{{balance}}",
  "{{link}}",
];

type HotelErrors = Partial<
  Record<"name" | "email" | "depositPct" | "checkInTime" | "checkOutTime", string>
>;

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const inputClass =
  "min-h-[44px] w-full rounded-[10px] border-0 bg-black/30 px-4 py-3 text-base text-white caret-white";
const textareaClass =
  "relative z-0 w-full resize-y rounded-[10px] border-0 bg-black/30 px-4 py-3 text-base text-white caret-white";
const emailBodyClass =
  "relative z-0 min-h-[280px] w-full resize-y rounded-[10px] border-0 bg-black/35 px-4 py-3 font-mono text-sm leading-relaxed text-white caret-white shadow-none";

export default function OwnerSettingsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [hotel, setHotel] = useState<HotelDto | null>(null);
  const [template, setTemplate] = useState<EmailTemplateDto | null>(null);
  const [hotelBaseline, setHotelBaseline] = useState("");
  const [templateBaseline, setTemplateBaseline] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [hotelSaving, setHotelSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [hotelErrors, setHotelErrors] = useState<HotelErrors>({});
  const [hotelMsg, setHotelMsg] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [subjectError, setSubjectError] = useState("");

  useDirtyGuard(
    (hotel !== null && JSON.stringify(hotel) !== hotelBaseline) ||
      (template !== null && JSON.stringify(template) !== templateBaseline)
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const [hRes, eRes] = await Promise.all([
        fetch("/api/hotel", { cache: "no-store" }),
        ownerFetch("/api/email-template", { cache: "no-store" }),
      ]);
      if (hRes.ok) {
        const h = (await hRes.json()) as HotelDto;
        setHotel(h);
        setHotelBaseline(JSON.stringify(h));
      }
      if (eRes.ok) {
        const e = (await eRes.json()) as EmailTemplateDto;
        setTemplate(e);
        setTemplateBaseline(JSON.stringify(e));
      }
      if (!hRes.ok || !eRes.ok) setLoadFailed(true);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setH(patch: Partial<HotelDto>) {
    setHotel((h) => (h ? { ...h, ...patch } : h));
    const keys = Object.keys(patch) as (keyof HotelErrors)[];
    setHotelErrors((e) => {
      const next = { ...e };
      for (const k of keys) delete next[k];
      return next;
    });
  }

  function validateHotel(h: HotelDto): HotelErrors {
    const e: HotelErrors = {};
    if (!h.name.trim()) e.name = t("ow.v.hotelName");
    if (!EMAIL_RE.test(h.email.trim())) e.email = t("ow.v.email");
    if (!Number.isInteger(h.depositPct) || h.depositPct < 0 || h.depositPct > 100) {
      e.depositPct = t("ow.v.deposit");
    }
    if (!TIME_RE.test(h.checkInTime.trim())) e.checkInTime = t("ow.v.time");
    if (!TIME_RE.test(h.checkOutTime.trim())) e.checkOutTime = t("ow.v.time");
    return e;
  }

  async function saveHotel() {
    if (!hotel) return;
    const found = validateHotel(hotel);
    setHotelErrors(found);
    if (Object.keys(found).length > 0) {
      setHotelMsg(t("ow.v.fix"));
      return;
    }
    setHotelSaving(true);
    setHotelMsg("");
    try {
      const res = await ownerFetch("/api/hotel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...hotel, email: hotel.email.trim() }),
      });
      if (!res.ok) {
        setHotelMsg(t("ow.ui.saveFailed"));
        toast(t("ow.ui.saveFailed"), "error");
        return;
      }
      const saved = (await res.json()) as HotelDto;
      setHotel(saved);
      setHotelBaseline(JSON.stringify(saved));
      toast(t("ow.set.hotelSaved"));
    } catch {
      setHotelMsg(t("ow.ui.offline"));
      toast(t("ow.ui.offline"), "error");
    } finally {
      setHotelSaving(false);
    }
  }

  async function saveEmail() {
    if (!template) return;
    if (!template.subject.trim()) {
      setSubjectError(t("ow.v.subject"));
      setEmailMsg(t("ow.v.fix"));
      return;
    }
    setEmailSaving(true);
    setEmailMsg("");
    try {
      const res = await ownerFetch("/api/email-template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: template.subject,
          body: template.body,
        }),
      });
      if (!res.ok) {
        setEmailMsg(t("ow.ui.saveFailed"));
        toast(t("ow.ui.saveFailed"), "error");
        return;
      }
      const saved = (await res.json()) as EmailTemplateDto;
      setTemplate(saved);
      setTemplateBaseline(JSON.stringify(saved));
      toast(t("ow.set.templateSaved"));
    } catch {
      setEmailMsg(t("ow.ui.offline"));
      toast(t("ow.ui.offline"), "error");
    } finally {
      setEmailSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">
          {t("ow.settings")}
        </h1>
        <p className="mt-4 text-white/60" role="status">{t("ow.ui.loading")}</p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-10">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
          {t("ow.ownerEyebrow")}
        </p>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
          {t("ow.settings")}
        </h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/70">
          {t("ow.setLead")}
        </p>
      </header>

      {loadFailed ? (
        <div className="owner-panel mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
          <p className="text-sm font-semibold text-red-300">{t("ow.ui.loadFailed")}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="owner-control min-h-[44px] rounded-xl px-4 text-sm font-bold text-white"
          >
            {t("ow.ui.retry")}
          </button>
        </div>
      ) : null}

      {/* Contact + policies */}
      <section className="owner-panel mb-8 rounded-2xl  p-6 md:p-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-white">
          {t("ow.setHotelH")}
        </h2>
        <p className="mb-6 text-sm text-white/55">
          {t("ow.setHotelSub")}
        </p>

        {hotel ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("ow.setName")} error={hotelErrors.name}>
                <input
                  value={hotel.name}
                  onChange={(e) => setH({ name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={t("ow.setTagline")} tip={t("ow.tip.settings.tagline")}>
                <input
                  value={hotel.tagline}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, tagline: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("ow.setEmail")} tip={t("ow.tip.settings.email")} error={hotelErrors.email}>
                <input
                  type="email"
                  value={hotel.email}
                  onChange={(e) => setH({ email: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={t("ow.setPhone")}>
                <input
                  value={hotel.phone}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, phone: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("ow.f.lineId")} tip={t("ow.tip.settings.line")}>
                <input
                  value={hotel.lineId}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, lineId: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={t("ow.setDeposit")} tip={t("ow.tip.settings.deposit")} error={hotelErrors.depositPct}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  inputMode="numeric"
                  value={Number.isNaN(hotel.depositPct) ? "" : hotel.depositPct}
                  onChange={(e) =>
                    setH({
                      depositPct: e.target.value === "" ? Number.NaN : Number(e.target.value),
                    })
                  }
                  aria-invalid={hotelErrors.depositPct ? true : undefined}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label={t("ow.setAddress")}>
              <input
                value={hotel.address}
                onChange={(e) =>
                  setHotel((h) => (h ? { ...h, address: e.target.value } : h))
                }
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("ow.setCity")}>
                <input
                  value={hotel.city}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, city: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={t("ow.setCountry")}>
                <input
                  value={hotel.country}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, country: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label={t("ow.setPostal")}>
                <input
                  value={hotel.postalCode}
                  onChange={(e) =>
                    setHotel((h) =>
                      h ? { ...h, postalCode: e.target.value } : h
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("ow.setCheckIn")} tip={t("ow.tip.settings.times")} error={hotelErrors.checkInTime}>
                <input
                  value={hotel.checkInTime}
                  placeholder="14:00"
                  inputMode="numeric"
                  onChange={(e) => setH({ checkInTime: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={t("ow.setCheckOut")} error={hotelErrors.checkOutTime}>
                <input
                  value={hotel.checkOutTime}
                  placeholder="12:00"
                  inputMode="numeric"
                  onChange={(e) => setH({ checkOutTime: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label={t("ow.setCancel")} tip={t("ow.tip.settings.cancel")}>
              <textarea
                rows={3}
                value={hotel.cancelPolicy}
                onChange={(e) =>
                  setHotel((h) =>
                    h ? { ...h, cancelPolicy: e.target.value } : h
                  )
                }
                className={textareaClass}
              />
            </Field>

            <Field label={t("ow.setPets")} tip={t("ow.tip.settings.pets")}>
              <textarea
                rows={2}
                value={hotel.petsPolicy}
                onChange={(e) =>
                  setHotel((h) =>
                    h ? { ...h, petsPolicy: e.target.value } : h
                  )
                }
                className={textareaClass}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void saveHotel()}
                disabled={hotelSaving}
                className="min-h-[44px] rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3d8ae6] disabled:opacity-60"
              >
                {hotelSaving ? t("ow.setSaving") : t("ow.setSaveHotel")}
              </button>
              {hotelMsg ? (
                <span className="text-sm font-semibold text-red-300" role="alert">{hotelMsg}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-white/60">{t("ow.set.hotelMissing")}</p>
        )}
      </section>

      {/* Email template */}
      <section className="owner-panel rounded-2xl  p-6 md:p-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-white">
          {t("ow.setEmailH")}
        </h2>
        <p className="mb-4 text-sm text-white/55">
          {t("ow.setEmailSub")}
        </p>

        <div className="mb-5 flex flex-wrap gap-2">
          {PLACEHOLDERS.map((p) => (
            <code
              key={p}
              className="owner-inset rounded-lg px-2.5 py-1 text-xs font-semibold text-own-blue"
            >
              {p}
            </code>
          ))}
        </div>

        {template ? (
          <div className="space-y-5">
            <Field label={t("ow.setSubject")} tip={t("ow.tip.settings.subject")} error={subjectError}>
              <input
                value={template.subject}
                onChange={(e) => {
                  setSubjectError("");
                  setTemplate((x) => (x ? { ...x, subject: e.target.value } : x));
                }}
                className={inputClass}
              />
            </Field>
            <Field label={t("ow.setBody")} tip={t("ow.tip.settings.body")}>
              <textarea
                rows={12}
                value={template.body}
                onChange={(e) =>
                  setTemplate((x) => (x ? { ...x, body: e.target.value } : x))
                }
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className={emailBodyClass}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void saveEmail()}
                disabled={emailSaving}
                className="min-h-[44px] rounded-xl bg-own-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#3d8ae6] disabled:opacity-60"
              >
                {emailSaving ? t("ow.setSaving") : t("ow.setSaveTemplate")}
              </button>
              {emailMsg ? (
                <span className="text-sm font-semibold text-red-300" role="alert">{emailMsg}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-white/60">{t("ow.set.templateMissing")}</p>
        )}
      </section>
    </div>
  );
}

/** The owner form field with optional ? help and inline error (OwnerUI). */
const Field = OwnerFormField;
