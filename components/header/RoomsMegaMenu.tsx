"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { useCurrency } from "@/lib/currency";
import { getSeedGuestRooms } from "@/lib/guestRooms";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}

/** Desktop-only mega-menu · isolated so Header mobile path never loads SafeImage/rooms. */
export function RoomsMegaMenu({ active }: { active: boolean }) {
  const { t, tr } = useI18n();
  const { format } = useCurrency();
  const rooms = getSeedGuestRooms();
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
        href="/rooms"
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
        {t("nav.rooms")}
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
          className="tkh-menu-pop absolute left-0 top-full z-modal mt-3 w-[min(92vw,720px)] rounded-2xl bg-white p-5 shadow-2xl"
        >
          <div className="grid gap-5 md:grid-cols-[1fr_180px]">
            <div className="grid grid-cols-2 gap-3">
              {rooms.slice(0, 4).map((room) => (
                <Link
                  key={room.id}
                  href={`/rooms/${room.slug}`}
                  role="menuitem"
                  className="flex gap-3 rounded-xl p-2 transition hover:bg-cloud"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative h-[54px] w-[72px] shrink-0 overflow-hidden rounded-lg">
                    <SafeImage
                      src={room.photos[0]}
                      alt={tr(room.name)}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink">
                      {tr(room.name)}
                    </div>
                    <div className="mt-0.5 whitespace-nowrap text-xs font-semibold text-blue">
                      {t("room.from")} {format(room.rate)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-1 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <Link
                href="/rooms"
                role="menuitem"
                className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink hover:bg-sky hover:text-blue"
                onClick={() => setOpen(false)}
              >
                {t("nav.megaAll")}
              </Link>
              <Link
                href="/rooms#compare"
                role="menuitem"
                className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink hover:bg-sky hover:text-blue"
                onClick={() => setOpen(false)}
              >
                {t("nav.megaCompare")}
              </Link>
              <Link
                href="/offers"
                role="menuitem"
                className="rounded-lg px-3 py-2.5 text-sm font-bold text-ink hover:bg-sky hover:text-blue"
                onClick={() => setOpen(false)}
              >
                {t("nav.megaOffers")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
