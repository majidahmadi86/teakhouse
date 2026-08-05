"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { SafeImage } from "@/components/SafeImage";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const AUTH_IMAGE =
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=85&auto=format&fit=crop";

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
  const { t, lang } = useI18n();
  const reduce = useReducedMotion();

  return (
    <div className="min-h-[calc(100svh-3.5rem)] bg-white md:min-h-[calc(100svh-4rem)] md:grid md:grid-cols-[45fr_55fr]">
      {/* Desktop left panel / mobile banner */}
      <div className="relative h-[200px] overflow-hidden md:h-auto md:min-h-full">
        <SafeImage
          src={AUTH_IMAGE}
          alt=""
          fill
          priority
          sizes="(max-width:768px) 100vw, 45vw"
          className="object-cover object-[center_40%]"
          fallbackSrcs={[
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1600&q=85&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=85&auto=format&fit=crop",
          ]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/35 to-navy/20" />
        <div className="absolute left-5 top-5 md:left-8 md:top-8">
          <Logo light showTag={false} size={22} />
        </div>
        <p
          className={cn(
            "absolute bottom-5 left-5 max-w-[16ch] text-xl italic leading-snug text-white hero-text-shadow md:bottom-10 md:left-8 md:text-[1.65rem]",
            lang === "th" ? "font-th-display not-italic font-semibold" : "font-display"
          )}
        >
          {t("hero.h1")}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-10 md:px-10 md:py-16">
        <motion.div
          className={cn("w-full max-w-[400px]", shake && "animate-tkh-shake")}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow mb-2">{eyebrow}</p>
          <h1
            className={cn(
              "text-[2rem] leading-tight text-ink md:text-[2.25rem]",
              lang === "th"
                ? "font-th-display font-semibold"
                : "font-display"
            )}
          >
            {title}
          </h1>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-sub">{footer}</div>
        </motion.div>
      </div>
    </div>
  );
}

export const authInputClass =
  "auth-input w-full rounded-[10px] border-[1.5px] border-line bg-white px-4 h-11 text-sm font-semibold text-ink placeholder:text-[#93A0B4] focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";

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
      <Link href={href} className="font-bold text-blue underline">
        {label}
      </Link>
    </p>
  );
}
