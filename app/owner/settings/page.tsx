"use client";

import { useCallback, useEffect, useState } from "react";
import type { EmailTemplateDto, HotelDto } from "@/lib/ownerTypes";

const PLACEHOLDERS = [
  "{{guestName}}",
  "{{hotelName}}",
  "{{code}}",
  "{{roomName}}",
  "{{checkIn}}",
  "{{checkOut}}",
  "{{amount}}",
  "{{deposit}}",
];

const inputClass =
  "min-h-[44px] w-full rounded-[10px] border border-white/10 bg-white/5 px-4 py-3 text-base text-white caret-white";
const textareaClass =
  "relative z-0 w-full resize-y rounded-[10px] border border-white/10 bg-white/5 px-4 py-3 text-base text-white caret-white";
const emailBodyClass =
  "relative z-0 min-h-[280px] w-full resize-y rounded-[10px] border border-white/10 bg-brand-2 px-4 py-3 font-mono text-sm leading-relaxed text-white caret-white shadow-none";

export default function OwnerSettingsPage() {
  const [hotel, setHotel] = useState<HotelDto | null>(null);
  const [template, setTemplate] = useState<EmailTemplateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotelSaving, setHotelSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [hotelMsg, setHotelMsg] = useState("");
  const [emailMsg, setEmailMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, eRes] = await Promise.all([
        fetch("/api/hotel"),
        fetch("/api/email-template"),
      ]);
      if (hRes.ok) setHotel((await hRes.json()) as HotelDto);
      if (eRes.ok) setTemplate((await eRes.json()) as EmailTemplateDto);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveHotel() {
    if (!hotel) return;
    setHotelSaving(true);
    setHotelMsg("");
    try {
      const res = await fetch("/api/hotel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotel),
      });
      if (!res.ok) {
        setHotelMsg("Save failed");
        return;
      }
      setHotel((await res.json()) as HotelDto);
      setHotelMsg("Saved");
    } finally {
      setHotelSaving(false);
    }
  }

  async function saveEmail() {
    if (!template) return;
    setEmailSaving(true);
    setEmailMsg("");
    try {
      const res = await fetch("/api/email-template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: template.subject,
          body: template.body,
        }),
      });
      if (!res.ok) {
        setEmailMsg("Save failed");
        return;
      }
      setTemplate((await res.json()) as EmailTemplateDto);
      setEmailMsg("Saved");
    } finally {
      setEmailSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-white">
          Settings
        </h1>
        <p className="mt-4 text-white/60">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-10">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
          Owner
        </p>
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
          Settings
        </h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/70">
          Hotel contact, stay policies, and booking confirmation email template.
        </p>
      </header>

      {/* Contact + policies */}
      <section className="owner-panel mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-white">
          Hotel contact & policies
        </h2>
        <p className="mb-6 text-sm text-white/55">
          Updates the Hotel record used by the property.
        </p>

        {hotel ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={hotel.name}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, name: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Tagline">
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
              <Field label="Email">
                <input
                  type="email"
                  value={hotel.email}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, email: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Phone">
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
              <Field label="LINE ID">
                <input
                  value={hotel.lineId}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, lineId: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Deposit %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={hotel.depositPct}
                  onChange={(e) =>
                    setHotel((h) =>
                      h
                        ? {
                            ...h,
                            depositPct: parseInt(e.target.value, 10) || 0,
                          }
                        : h
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Address">
              <input
                value={hotel.address}
                onChange={(e) =>
                  setHotel((h) => (h ? { ...h, address: e.target.value } : h))
                }
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City">
                <input
                  value={hotel.city}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, city: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Country">
                <input
                  value={hotel.country}
                  onChange={(e) =>
                    setHotel((h) => (h ? { ...h, country: e.target.value } : h))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Postal code">
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
              <Field label="Check-in time">
                <input
                  value={hotel.checkInTime}
                  onChange={(e) =>
                    setHotel((h) =>
                      h ? { ...h, checkInTime: e.target.value } : h
                    )
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Check-out time">
                <input
                  value={hotel.checkOutTime}
                  onChange={(e) =>
                    setHotel((h) =>
                      h ? { ...h, checkOutTime: e.target.value } : h
                    )
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Cancellation policy">
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

            <Field label="Pets policy">
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
                {hotelSaving ? "Saving…" : "Save hotel"}
              </button>
              {hotelMsg ? (
                <span className="text-sm font-semibold text-deal">{hotelMsg}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-white/60">Hotel record unavailable.</p>
        )}
      </section>

      {/* Email template */}
      <section className="owner-panel rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-white">
          Confirmation email
        </h2>
        <p className="mb-4 text-sm text-white/55">
          Subject and body for booking confirmation. Placeholders are replaced
          when a booking is created. Delivery is stubbed until EMAIL_PROVIDER is
          configured.
        </p>

        <div className="mb-5 flex flex-wrap gap-2">
          {PLACEHOLDERS.map((p) => (
            <code
              key={p}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-own-blue"
            >
              {p}
            </code>
          ))}
        </div>

        {template ? (
          <div className="space-y-5">
            <Field label="Subject">
              <input
                value={template.subject}
                onChange={(e) =>
                  setTemplate((t) =>
                    t ? { ...t, subject: e.target.value } : t
                  )
                }
                className={inputClass}
              />
            </Field>
            <Field label="Body">
              <textarea
                rows={12}
                value={template.body}
                onChange={(e) =>
                  setTemplate((t) => (t ? { ...t, body: e.target.value } : t))
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
                {emailSaving ? "Saving…" : "Save template"}
              </button>
              {emailMsg ? (
                <span className="text-sm font-semibold text-deal">{emailMsg}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-white/60">Template unavailable.</p>
        )}
      </section>
    </div>
  );
}

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
