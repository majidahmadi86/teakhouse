"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Room } from "@/lib/rooms";
import { cn } from "@/lib/utils";

/**
 * v15 · The house as a plan · an interactive spatial preview.
 *
 * A stylised site plan of the teak house: the Chao Phraya along the top, the
 * pier, the two-floor main house, the courtyard, the pool, the garden rooms and
 * the annex. Each room is a hotspot: hover previews it, click selects it, and
 * availability for the chosen dates tints it. Inline SVG, so it costs nothing
 * to load, scales to any width, and reads with a screen reader as a list of
 * buttons.
 *
 * Rooms the plan does not know (an owner-added type) take the spare bays on
 * the garden side, so the map never hides a room that can be booked.
 */

type Bay = { x: number; y: number; w: number; h: number; floor?: "upper" };

const PLAN: Record<string, Bay> = {
  "river-loft": { x: 92, y: 122, w: 176, h: 62, floor: "upper" },
  "captains-cabin": { x: 276, y: 122, w: 122, h: 62, floor: "upper" },
  "attic-nook": { x: 406, y: 122, w: 96, h: 62, floor: "upper" },
  "teak-suite": { x: 92, y: 192, w: 150, h: 70 },
  "pier-studio": { x: 250, y: 192, w: 118, h: 70 },
  "courtyard-twin": { x: 376, y: 192, w: 126, h: 70 },
  "garden-room": { x: 92, y: 350, w: 128, h: 70 },
  "mango-corner": { x: 228, y: 350, w: 118, h: 70 },
  "poolside-hide": { x: 384, y: 350, w: 118, h: 70 },
  "family-annex": { x: 560, y: 192, w: 120, h: 150 },
};

const SPARE_BAYS: Bay[] = [
  { x: 560, y: 350, w: 120, h: 70 },
  { x: 560, y: 122, w: 120, h: 62 },
  { x: 92, y: 428, w: 128, h: 56 },
  { x: 228, y: 428, w: 118, h: 56 },
  { x: 384, y: 428, w: 118, h: 56 },
  { x: 560, y: 428, w: 120, h: 56 },
];

export type MapAvailability = Record<string, { available: boolean; unitsLeft: number; total: number | null }>;

export function PropertyMap({
  rooms,
  selected,
  availability,
  onSelect,
  formatPrice,
  className,
}: {
  rooms: Room[];
  selected: string | null;
  availability: MapAvailability | null;
  onSelect: (room: Room) => void;
  formatPrice: (thb: number) => string;
  className?: string;
}) {
  const { t, tr } = useI18n();
  const [hover, setHover] = useState<string | null>(null);
  const titleId = useId();

  let spare = 0;
  const bays = rooms.map((room) => {
    const bay = PLAN[room.slug] ?? SPARE_BAYS[spare++ % SPARE_BAYS.length];
    return { room, bay };
  });
  const focus = hover ?? selected;
  const focusRoom = focus ? rooms.find((r) => r.slug === focus) ?? null : null;
  const focusAvail = focusRoom && availability ? availability[focusRoom.slug] : undefined;

  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-line bg-[#F7F3EA]", className)} data-property-map>
      <svg
        viewBox="0 0 720 500"
        role="group"
        aria-labelledby={titleId}
        className="block h-auto w-full select-none"
        style={{ aspectRatio: "720 / 500" }}
      >
        <title id={titleId}>{t("bk.map.title")}</title>
        <defs>
          <linearGradient id="tkh-river" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#B7D3E6" />
            <stop offset="1" stopColor="#8FB6D2" />
          </linearGradient>
          <pattern id="tkh-teak" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#E8DCC2" />
            <path d="M0 5h10" stroke="#DCCBA6" strokeWidth="1" />
          </pattern>
          <pattern id="tkh-water" width="24" height="12" patternUnits="userSpaceOnUse">
            <path d="M0 6 Q6 2 12 6 T24 6" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
          </pattern>
        </defs>

        {/* River */}
        <rect x="0" y="0" width="720" height="84" fill="url(#tkh-river)" />
        <rect x="0" y="0" width="720" height="84" fill="url(#tkh-water)" />
        <text x="16" y="30" className="fill-white/90 font-display" fontSize="15" letterSpacing="3">
          {t("bk.map.river").toUpperCase()}
        </text>
        {/* Long-tail boat */}
        <g transform="translate(560 44)" fill="#0A2E5C" opacity="0.7">
          <path d="M0 6 L60 6 L70 0 L64 12 L2 12 Z" />
          <rect x="18" y="-8" width="24" height="8" rx="2" />
        </g>

        {/* Pier */}
        <rect x="300" y="64" width="86" height="58" fill="#C9B28C" />
        <rect x="300" y="64" width="86" height="58" fill="url(#tkh-teak)" opacity="0.6" />
        <text x="343" y="100" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5A4630">
          {t("bk.map.pier")}
        </text>

        {/* Grounds */}
        <rect x="24" y="100" width="672" height="380" rx="18" fill="#EEF3E4" />
        {/* Garden */}
        <ellipse cx="300" cy="300" rx="120" ry="34" fill="#DCE9C8" />
        <text x="300" y="304" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4C6B3A">
          {t("bk.map.courtyard")}
        </text>
        {/* Mango tree */}
        <circle cx="200" cy="300" r="22" fill="#9DBB80" />
        <circle cx="212" cy="290" r="14" fill="#B4CE97" />
        {/* Pool */}
        <rect x="392" y="278" width="118" height="48" rx="14" fill="#9FD1E2" />
        <rect x="392" y="278" width="118" height="48" rx="14" fill="url(#tkh-water)" />
        <text x="451" y="306" textAnchor="middle" fontSize="11" fontWeight="700" fill="#245C74">
          {t("bk.map.pool")}
        </text>

        {/* Main house block */}
        <rect x="80" y="112" width="434" height="160" rx="10" fill="#E2D2B0" stroke="#B89B69" strokeWidth="2" />
        <text x="84" y="108" fontSize="10" fontWeight="800" fill="#7A6242" letterSpacing="1.5">
          {t("bk.map.house").toUpperCase()}
        </text>
        {/* Annex */}
        <rect x="548" y="180" width="144" height="174" rx="10" fill="#E2D2B0" stroke="#B89B69" strokeWidth="2" />
        {/* Garden wing */}
        <rect x="80" y="340" width="434" height="90" rx="10" fill="#E2D2B0" stroke="#B89B69" strokeWidth="2" />

        {bays.map(({ room, bay }) => {
          const avail = availability?.[room.slug];
          const isSelected = selected === room.slug;
          const isHover = hover === room.slug;
          const unavailable = avail ? !avail.available : false;
          const fill = isSelected
            ? "#0A6CDE"
            : unavailable
              ? "#D9D2C5"
              : isHover
                ? "#FFF4DA"
                : "#FFFDF7";
          const stroke = isSelected ? "#0857BE" : unavailable ? "#B9B0A2" : "#B89B69";
          return (
            <g
              key={room.slug}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-disabled={unavailable}
              aria-label={`${tr(room.name)}${avail ? ` · ${unavailable ? t("bk.map.full") : t("bk.map.free")}` : ""}`}
              data-map-room={room.slug}
              className={cn("outline-none", unavailable ? "cursor-not-allowed" : "cursor-pointer")}
              onMouseEnter={() => setHover(room.slug)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(room.slug)}
              onBlur={() => setHover(null)}
              onClick={() => !unavailable && onSelect(room)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !unavailable) {
                  e.preventDefault();
                  onSelect(room);
                }
              }}
            >
              <rect
                x={bay.x}
                y={bay.y}
                width={bay.w}
                height={bay.h}
                rx="7"
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected || isHover ? 2.5 : 1.5}
                style={{ transition: "fill .2s ease, stroke .2s ease" }}
              />
              {bay.floor === "upper" ? (
                <text x={bay.x + 8} y={bay.y + 14} fontSize="8" fontWeight="800" fill={isSelected ? "#DCEBFF" : "#9A8460"} letterSpacing="1">
                  {t("bk.map.upper").toUpperCase()}
                </text>
              ) : null}
              <text
                x={bay.x + bay.w / 2}
                y={bay.y + bay.h / 2 + (bay.floor === "upper" ? 6 : 2)}
                textAnchor="middle"
                fontSize={bay.w < 110 ? 10.5 : 12}
                fontWeight="700"
                fill={isSelected ? "#FFFFFF" : unavailable ? "#8C8477" : "#17212E"}
                style={{ pointerEvents: "none" }}
              >
                {tr(room.name)}
              </text>
              {avail && !unavailable && avail.unitsLeft > 1 ? (
                <text x={bay.x + bay.w - 8} y={bay.y + bay.h - 8} textAnchor="end" fontSize="8.5" fontWeight="800" fill={isSelected ? "#DCEBFF" : "#067647"}>
                  ×{avail.unitsLeft}
                </text>
              ) : null}
              {unavailable ? (
                <text x={bay.x + bay.w / 2} y={bay.y + bay.h - 8} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#8C8477">
                  {t("bk.map.full").toUpperCase()}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Preview strip · fixed height so nothing below it moves (CLS 0). */}
      <div className="flex min-h-[76px] items-center gap-3 border-t border-line bg-white px-4 py-3">
        {focusRoom ? (
          <>
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-cloud">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${focusRoom.photos[0]}?w=256&q=60&auto=format&fit=crop`}
                alt=""
                width={64}
                height={48}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base text-ink">{tr(focusRoom.name)}</p>
              <p className="truncate text-[0.76rem] font-semibold text-sub">{tr(focusRoom.meta)}</p>
            </div>
            <div className="shrink-0 text-right">
              {focusAvail?.total != null ? (
                <p className="text-sm font-bold text-ink">{formatPrice(focusAvail.total)}</p>
              ) : (
                <p className="text-sm font-bold text-ink">{formatPrice(focusRoom.rate)}</p>
              )}
              <p className={cn("text-[0.7rem] font-bold", focusAvail && !focusAvail.available ? "text-strike" : "text-deal")}>
                {focusAvail ? (focusAvail.available ? t("bk.map.free") : t("bk.map.full")) : t("room.night")}
              </p>
            </div>
          </>
        ) : (
          <p className="text-[0.82rem] font-semibold text-sub">{t("bk.map.hint")}</p>
        )}
      </div>
    </div>
  );
}
