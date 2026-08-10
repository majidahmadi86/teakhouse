"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AuthFooterLink,
  AuthShell,
  authInputClass,
} from "@/components/AuthShell";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";

function SignUpForm() {
  const { t } = useI18n();
  const { signUp } = useGuestAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const bookingId = searchParams.get("booking") || undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function triggerShake() {
    setShake(true);
    window.setTimeout(() => setShake(false), 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = await signUp(name, email, password, bookingId);
    if (err === "exists") {
      setError(t("acc.errExists"));
      triggerShake();
      return;
    }
    if (err === "missing") {
      setError(t("acc.errMissing"));
      triggerShake();
      return;
    }
    router.push(next);
  }

  const signinHref =
    next !== "/account"
      ? `/account/signin?next=${encodeURIComponent(next)}`
      : "/account/signin";

  return (
    <AuthShell
      eyebrow={t("acc.signup")}
      title={t("acc.join")}
      shake={shake}
      footer={
        <AuthFooterLink
          prompt={t("acc.haveAccount")}
          href={signinHref}
          label={t("acc.signin")}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-blue">
            {t("acc.name")}
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass}
            autoComplete="name"
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
            className={authInputClass}
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
            className={authInputClass}
            autoComplete="new-password"
            required
            minLength={4}
          />
        </label>
        {error ? (
          <p className="text-sm font-semibold text-coral-deep">{error}</p>
        ) : null}
        <button type="submit" className="btn-primary mt-2 w-full">
          {t("acc.create")}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue border-t-transparent" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
