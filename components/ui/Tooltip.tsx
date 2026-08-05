"use client";

import { cn } from "@/lib/utils";

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
  side?: "bottom" | "top";
};

/** Navy pill tooltip, 12px white, 150ms fade. */
export function Tooltip({
  label,
  children,
  className,
  side = "bottom",
}: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-[80] -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-2.5 py-1 text-[12px] font-semibold text-white opacity-0 shadow-card transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          side === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
        )}
      >
        {label}
      </span>
    </span>
  );
}
