"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useStaff } from "@/lib/staffSession";
import { Logo } from "@/components/Logo";

/**
 * v15 · Staff sign-in · email + password, verified on the server, session in
 * an HttpOnly cookie. The v14 screen compared a PIN in the browser.
 */
export function LoginScreen() {
  const { t } = useI18n();
  const { login } = useStaff();
  const [email, setEmail] = useState("owner@teakhouse.demo");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email.trim().toLowerCase(), password);
    setBusy(false);
    setError(!ok);
  }

  return (
    <div className="own-theme flex min-h-screen flex-col items-center justify-center bg-brand-2 px-4 py-12">
      <div className="mb-10 text-white">
        <Logo className="h-8 w-auto brightness-0 invert" />
      </div>

      <div className="owner-panel w-full max-w-md rounded-2xl p-8 backdrop-blur-sm">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-gold">{t("ow.eyebrow")}</p>
        <h1 className="font-display text-2xl font-semibold text-white">{t("ow.login")}</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="owner-email" className="mb-2 block text-sm font-semibold text-white/80">
              {t("ow.email")}
            </label>
            <input
              id="owner-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="min-h-[44px] w-full px-4 py-3 text-base"
            />
          </div>

          <div>
            <label htmlFor="owner-pin" className="mb-2 block text-sm font-semibold text-white/80">
              {t("ow.password")}
            </label>
            <input
              id="owner-pin"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="min-h-[44px] w-full px-4 py-3 text-base"
            />
            <p className="mt-2 text-sm font-semibold text-gold/80">{t("ow.pinHint")}</p>
          </div>

          {error ? (
            <p className="text-sm font-semibold text-red-300" role="alert">
              {t("ow.loginFailed")}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="min-h-[44px] w-full rounded-xl bg-own-blue px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {t("ow.signin")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="font-semibold text-white/60 hover:text-white">
            {t("ow.back")}
          </Link>
        </p>
      </div>
    </div>
  );
}
