"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The sign-in and sign-up form column. Its photograph panel is server HTML
 * (components/AuthFrame in the auth layouts), so this island carries no
 * image registry and no animation library.
 */
type AuthShellProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  shake?: boolean;
};

export function AuthShell({
  eyebrow,
  title,
  children,
  footer,
  shake,
}: AuthShellProps) {
  return (
    <div className="flex items-center justify-center px-5 py-12 sm:px-8 md:py-20">
      <div className={cn("tkh-hero-fade w-full max-w-[420px]", shake && "animate-tkh-shake")}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-[clamp(2rem,3vw,2.6rem)] leading-tight text-ink">{title}</h1>
        <div className="mt-8">{children}</div>
        <div className="mt-6 text-center text-[14.5px] text-sub">{footer}</div>
      </div>
    </div>
  );
}

export const authInputClass =
  "auth-input h-12 w-full px-4 text-[16px] text-ink placeholder:text-sub";

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p>
      {prompt}{" "}
      <Link href={href} className="font-medium text-forest underline underline-offset-4">
        {label}
      </Link>
    </p>
  );
}
