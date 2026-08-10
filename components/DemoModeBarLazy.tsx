"use client";

import dynamic from "next/dynamic";

const DemoModeBar = dynamic(
  () => import("@/components/DemoModeBar").then((m) => m.DemoModeBar),
  { ssr: false }
);

/** Client island · keeps demo chrome off the SSR/LCP path. */
export function DemoModeBarLazy() {
  return <DemoModeBar />;
}
