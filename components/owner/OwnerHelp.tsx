"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { AlertTriangle, BookOpen, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * v18 · The owner panel's page guides. Static copy in lib/i18n-dict.ts under
 * ow.guide.<page>.* (title, what, s1..sN, mistake), EN and TH, one guide for
 * each of the nine owner pages. The shell's "How this page works" button opens
 * the guide for the current page; /owner/help lists them all.
 */
export type GuidePage =
  | "dash"
  | "bookings"
  | "rooms"
  | "calendar"
  | "rates"
  | "dining"
  | "events"
  | "messages"
  | "settings";

export const GUIDES: { page: GuidePage; href: string; steps: number }[] = [
  { page: "dash", href: "/owner", steps: 4 },
  { page: "bookings", href: "/owner/bookings", steps: 5 },
  { page: "rooms", href: "/owner/rooms", steps: 5 },
  { page: "calendar", href: "/owner/calendar", steps: 4 },
  { page: "rates", href: "/owner/rates", steps: 5 },
  { page: "dining", href: "/owner/dining", steps: 5 },
  { page: "events", href: "/owner/events", steps: 4 },
  { page: "messages", href: "/owner/messages", steps: 4 },
  { page: "settings", href: "/owner/settings", steps: 5 },
];

/** The guide for an owner path, or null (the help centre itself). */
export function guideForPath(pathname: string): GuidePage | null {
  if (pathname === "/owner" || pathname === "/owner/") return "dash";
  const hit = GUIDES.find((g) => g.href !== "/owner" && pathname.startsWith(g.href));
  return hit?.page ?? null;
}

export function guideSteps(page: GuidePage): number {
  return GUIDES.find((g) => g.page === page)?.steps ?? 4;
}

/** One guide's body · what the page does, numbered steps, one common mistake. */
export function GuideBody({ page }: { page: GuidePage }) {
  const { t } = useI18n();
  const steps = guideSteps(page);
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-white/75">{t(`ow.guide.${page}.what`)}</p>
      <ol className="space-y-3">
        {Array.from({ length: steps }, (_, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/85">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-own-blue/20 text-xs font-extrabold text-own-blue">
              {i + 1}
            </span>
            <span>{t(`ow.guide.${page}.s${i + 1}`)}</span>
          </li>
        ))}
      </ol>
      <div className="owner-inset rounded-xl px-4 py-3">
        <p className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          {t("ow.help.mistake")}
        </p>
        <p className="text-sm leading-relaxed text-white/75">{t(`ow.guide.${page}.mistake`)}</p>
      </div>
    </div>
  );
}

/** The drawer the shell opens for the current page. */
export function GuideDrawer({
  page,
  open,
  onClose,
}: {
  page: GuidePage | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Transition show={open && page !== null} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-modal">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 flex justify-end">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-x-full"
            enterTo="opacity-100 translate-x-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 translate-x-full"
          >
            <DialogPanel className="own-theme flex h-full w-full max-w-md flex-col bg-brand-2 shadow-[-12px_0_40px_rgba(0,0,0,.45)]">
              {page ? (
                <>
                  <div className="owner-split-b flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
                        {t("ow.help.howTitle")}
                      </p>
                      <DialogTitle className="mt-1 font-display text-xl font-semibold text-white">
                        {t(`ow.guide.${page}.title`)}
                      </DialogTitle>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label={t("ow.ui.close")}
                      className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-white/60 hover:bg-white/10"
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-6">
                    <GuideBody page={page} />
                  </div>
                  <div className="owner-split-t p-5">
                    <Link
                      href="/owner/help"
                      onClick={onClose}
                      className="owner-control flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
                    >
                      <BookOpen className="h-4 w-4" aria-hidden />
                      {t("ow.help.openCentre")}
                    </Link>
                  </div>
                </>
              ) : null}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
