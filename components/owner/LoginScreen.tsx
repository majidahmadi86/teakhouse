"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useOwner } from "@/lib/ownerStore";
import { Logo } from "@/components/Logo";

export function LoginScreen() {
  const { t } = useI18n();
  const { login } = useOwner();
  const [email, setEmail] = useState("owner@teakhouse.co");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(email.trim(), pin);
    if (!ok) {
      setError(true);
      return;
    }
    setError(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-2 px-4 py-12">
      <div className="mb-10 text-white">
        <Logo className="h-8 w-auto brightness-0 invert" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-sm">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">
          {t("ow.eyebrow")}
        </p>
        <h1 className="font-display text-2xl font-semibold text-white">
          {t("ow.login")}
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="owner-email"
              className="mb-2 block text-sm font-semibold text-white/80"
            >
              {t("ow.email")}
            </label>
            <input
              id="owner-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </div>

          <div>
            <label
              htmlFor="owner-pin"
              className="mb-2 block text-sm font-semibold text-white/80"
            >
              {t("ow.pin")}
            </label>
            <input
              id="owner-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            <p className="mt-2 text-sm font-semibold text-gold/80">
              {t("ow.pinHint")}
            </p>
          </div>

          {error ? (
            <p className="text-sm font-semibold text-red-300">
              Invalid PIN. Use 1234 for demo.
            </p>
          ) : null}

          <button
            type="submit"
            className="min-h-[44px] w-full rounded-xl bg-gold px-6 py-3 text-base font-extrabold text-white transition hover:bg-gold/90"
          >
            {t("ow.signin")}
          </button>
        </form>
      </div>

      <Link
        href="/"
        className="mt-8 min-h-[44px] inline-flex items-center text-sm font-semibold text-white/60 transition hover:text-white"
      >
        {t("ow.back")}
      </Link>
    </div>
  );
}
