"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";

function SignInForm() {
  const { t } = useI18n();
  const { signIn } = useGuestAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = signIn(email, password);
    if (err === "invalid") {
      setError(t("acc.errInvalid"));
      return;
    }
    if (err === "missing") {
      setError(t("acc.errMissing"));
      return;
    }
    router.push(next);
  }

  return (
    <section className="section-pad bg-cloud">
      <div className="mx-auto w-full max-w-md rounded-[14px] bg-white p-8 shadow-panel">
        <p className="eyebrow mb-2">{t("acc.signin")}</p>
        <h1 className="font-display text-3xl text-ink">{t("acc.welcome")}</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">
              {t("acc.email")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">
              {t("acc.password")}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
              required
            />
          </label>
          {error ? (
            <p className="text-sm font-semibold text-coral-deep">{error}</p>
          ) : null}
          <button type="submit" className="btn-primary w-full">
            {t("acc.signin")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-sub">
          {t("acc.newHere")}{" "}
          <Link
            href={`/account/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-bold text-blue underline"
          >
            {t("acc.signup")}
          </Link>
        </p>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-line bg-white px-4 py-3 text-sm font-semibold text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="section-pad flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue border-t-transparent" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
