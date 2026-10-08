"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNextParam } from "@/lib/useNextParam";
import {
  AuthFooterLink,
  AuthShell,
  authInputClass,
} from "@/components/AuthShell";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { useGuestAuth } from "@/lib/guestAuth";
import { useI18n } from "@/lib/i18n";

function SignUpForm() {
  const { t } = useI18n();
  const { signUp } = useGuestAuth();
  const router = useRouter();
  const { next, bookingId } = useNextParam();

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
      <SocialLoginButtons />
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

/**
 * A static page: the query (?next=, ?booking=) is read from the address once
 * the form has hydrated, not through useSearchParams(), which would leave the
 * static HTML as an empty Suspense fallback (and unreadable with scripting off).
 */
export default function SignUpPage() {
  return <SignUpForm />;
}
