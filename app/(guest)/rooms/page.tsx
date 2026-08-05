"use client";

import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { RoomCard } from "@/components/RoomCard";
import { useCurrency } from "@/lib/currency";
import { useGuestRooms } from "@/lib/ownerStore";
import { useI18n } from "@/lib/i18n";
import type { Room } from "@/lib/rooms";

const DESC_KEYS: Record<string, string> = {
  "river-loft": "rp.r1p",
  "teak-suite": "rp.r2p",
  "garden-room": "rp.r3p",
  "courtyard-twin": "rp.r4p",
};

const INCLUDES = ["rp.i1", "rp.i2", "rp.i3", "rp.i4", "rp.i5", "rp.i6"] as const;

function CompareTable({
  rooms,
  t,
  tr,
  format,
}: {
  rooms: Room[];
  t: (k: string) => string;
  tr: (e: { en: string; th: string }) => string;
  format: (n: number) => string;
}) {
  const rows: {
    key: string;
    label: string;
    render: (room: Room) => string;
  }[] = [
    { key: "size", label: t("cmp.size"), render: (r) => `${r.sizeM2} m²` },
    { key: "bed", label: t("cmp.bed"), render: (r) => tr(r.bedType) },
    { key: "sleeps", label: t("cmp.sleeps"), render: (r) => String(r.capacity) },
    { key: "view", label: t("cmp.view"), render: (r) => tr(r.view) },
    {
      key: "bathtub",
      label: t("cmp.bathtub"),
      render: (r) => (r.bathtub ? t("cmp.yes") : t("cmp.no")),
    },
    {
      key: "balcony",
      label: t("cmp.balcony"),
      render: (r) => (r.balcony ? t("cmp.yes") : t("cmp.no")),
    },
    {
      key: "pets",
      label: t("cmp.pets"),
      render: (r) => (r.pets ? t("cmp.yes") : t("cmp.no")),
    },
    {
      key: "direct",
      label: t("cmp.direct"),
      render: (r) => format(r.rate),
    },
    {
      key: "agoda",
      label: t("cmp.agoda"),
      render: (r) => format(r.ota),
    },
  ];

  return (
    <div className="mt-8 overflow-x-auto rounded-card border border-line bg-white shadow-card">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-cloud">
            <th className="sticky left-0 z-10 bg-cloud p-4 text-left font-semibold text-sub" />
            {rooms.map((room) => (
              <th
                key={room.id}
                className="p-4 text-left font-display text-base text-navy"
              >
                {tr(room.name)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-line/70">
              <td className="sticky left-0 z-10 bg-white p-4 font-semibold text-ink">
                {row.label}
              </td>
              {rooms.map((room) => (
                <td key={room.id} className="p-4 text-sub">
                  {row.render(room)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RoomsPage() {
  const { t, tr } = useI18n();
  const { format } = useCurrency();
  const rooms = useGuestRooms();

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1900&q=80"
        alt="Teak hotel room interior"
        eyebrow={t("rooms.eyebrow")}
        title={t("rp.h1")}
        lead={t("rp.lead")}
      />

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-7 md:grid-cols-2">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                variant="full"
                descriptionKey={DESC_KEYS[room.slug]}
              />
            ))}
          </div>

          <div className="mt-20" id="compare">
            <h2 className="mb-2">{t("rooms.compare")}</h2>
            <CompareTable rooms={rooms} t={t} tr={tr} format={format} />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white px-6 py-20">
        <div className="mx-auto max-w-[1180px]">
          <h2>{t("rp.inc")}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDES.map((key) => (
              <article key={key} className="tkh-card p-6">
                <h3 className="text-lg">{t(key)}</h3>
              </article>
            ))}
          </div>
          <p className="mt-12 text-center">
            <Link href="/book" className="btn-primary">
              {t("nav.book")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
