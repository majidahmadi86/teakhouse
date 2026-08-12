"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Metric info tip · a small drawn ⓘ that opens a text popover. Hover, tap and
 * keyboard focus all open it; ESC, outside tap and blur close it. The visible
 * glyph stays 18px but the hit area is 44px (invisible ::before inset). The
 * bubble measures itself after opening and clamps horizontally so a card edge
 * or the viewport can never clip it.
 */
export function InfoTip({ label, text }: { label: string; text: string }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = hovered || pinned;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPinned(false);
        setHovered(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPinned(false);
        setHovered(false);
      }
    }
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Clamp the bubble inside the viewport · measured once per open, while the
  // bubble still sits at its centered resting position (shift resets on close).
  useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const el = bubbleRef.current;
    if (!el) return;
    const pad = 12;
    const r = el.getBoundingClientRect();
    if (r.left < pad) setShift(pad - r.left);
    else if (r.right > window.innerWidth - pad) {
      setShift(window.innerWidth - pad - r.right);
    }
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setPinned((p) => !p)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className={cn(
          "relative inline-flex h-[18px] w-[18px] items-center justify-center rounded-full transition",
          "before:absolute before:-inset-[13px] before:content-['']",
          open ? "text-white/85" : "text-white/40 hover:text-white/70"
        )}
      >
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden>
          <circle
            cx="10"
            cy="10"
            r="8.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="10" cy="6.1" r="1.2" fill="currentColor" />
          <rect x="9.05" y="8.5" width="1.9" height="6.2" rx="0.95" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <div
          ref={bubbleRef}
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-modal mt-2.5 w-64 max-w-[78vw] rounded-xl bg-brand px-3.5 py-3 text-left text-xs font-semibold normal-case leading-relaxed tracking-normal text-white/85 shadow-[0_16px_40px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.08)]"
          style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
        >
          {text}
        </div>
      ) : null}
    </span>
  );
}
