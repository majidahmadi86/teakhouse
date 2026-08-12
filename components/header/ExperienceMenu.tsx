"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}

export const EXPERIENCE_MENU_ITEMS = [
  { href: "/experience", key: "nav.experience" },
  { href: "/facilities", key: "nav.facilities" },
  { href: "/gallery", key: "nav.gallery" },
] as const;

/**
 * Desktop-only "Experience" dropdown · v13 nav grouping (Experience,
 * Facilities, Gallery · Events was promoted to a top-level item). Same
 * open/close behaviour as
 * RoomsMegaMenu: hover with a close delay, focus, ArrowDown, ESC. The trigger
 * itself still links to /experience, so the group works without the menu.
 */
export function ExperienceMenu({ active }: { active: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <Link
        href="/experience"
        className={cn(
          "group relative inline-flex items-center gap-1 whitespace-nowrap text-[15px] font-semibold transition",
          active || open ? "text-blue" : "text-ink hover:text-blue"
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {t("nav.experience")}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition", open && "rotate-180")}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -bottom-1 left-0 h-0.5 bg-blue transition-all duration-300",
            active || open ? "w-full" : "w-0 group-hover:w-full"
          )}
        />
      </Link>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="tkh-menu-pop absolute left-0 top-full z-modal mt-3 w-56 rounded-2xl bg-white p-2 shadow-2xl"
        >
          {EXPERIENCE_MENU_ITEMS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-sky hover:text-blue",
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-blue"
                  : "text-ink"
              )}
              onClick={() => setOpen(false)}
            >
              {t(key)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
