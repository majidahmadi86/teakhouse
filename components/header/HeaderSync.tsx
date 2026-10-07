"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { navGroupOf, sectionOfPath } from "@/components/header/nav";

type PopoverEl = HTMLElement & { hidePopover?: () => void };

/**
 * The header is server HTML that persists across client-side navigation, so a
 * few small things are kept in step here. It renders nothing and never changes
 * what the header looks like before or after hydration (the active item, the
 * menus and the drawer all work in CSS and native HTML on their own):
 *
 * - aria-current="page" on the active item (the CSS lights it from NavMark)
 * - the phone drawer and any open <details> menu close when the page changes,
 *   on an outside click and on Escape
 * - the language links keep the current query string (a /book stay survives
 *   a language change)
 * - data-scrolled on the header once the page scrolls (the frosted header)
 *
 * The path comes from window.location, never from rendering usePathname():
 * a static page is prerendered under its internal locale segment, so the
 * server's pathname and the browser's differ (see app/[lang]/layout.tsx).
 * usePathname() is only the "the page changed" trigger.
 */
export function HeaderSync() {
  const pathname = usePathname();

  useEffect(() => {
    const path = window.location.pathname;
    const section = sectionOfPath(path);
    const group = section ? navGroupOf(section) : null;

    document.querySelectorAll<HTMLAnchorElement>("a[data-nav]").forEach((a) => {
      if (section && a.dataset.nav === section) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.querySelectorAll<HTMLAnchorElement>("a[data-nav-group]").forEach((a) => {
      if (group && a.dataset.navGroup === group) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    // The Experience group opens in the drawer when one of its pages is open.
    document.querySelectorAll<HTMLDetailsElement>("details[data-nav-details]").forEach((d) => {
      d.open = group === "experience";
    });

    // Language links keep the stay (or any other) query.
    const params = new URLSearchParams(window.location.search);
    params.delete("lang");
    document.querySelectorAll<HTMLAnchorElement>("a[data-lang-link]").forEach((a) => {
      const next = new URLSearchParams(params);
      next.set("lang", a.dataset.langLink ?? "en");
      a.setAttribute("href", `${path}?${next.toString()}`);
    });

    // A navigation closes every menu.
    const drawer = document.getElementById("mobile-nav-drawer") as PopoverEl | null;
    try {
      if (drawer?.matches(":popover-open")) drawer.hidePopover?.();
    } catch {
      /* Popover API missing · the :target fallback closes with the hash. */
    }
    document.querySelectorAll<HTMLDetailsElement>("details.tkh-lang[open]").forEach((d) => {
      d.open = false;
    });
  }, [pathname]);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    // Home's phone Book bar: CSS reveals it with a scroll timeline; where the
    // browser has none (or motion is reduced) it is revealed from here.
    const bar = document.querySelector<HTMLElement>("[data-mobile-book-bar][data-defer]");
    const barByScript =
      !!bar &&
      (!CSS.supports("animation-timeline: scroll()") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (header) {
          if (window.scrollY > 8) header.setAttribute("data-scrolled", "");
          else header.removeAttribute("data-scrolled");
        }
        if (bar && barByScript) {
          const hero = document.getElementById("tkh-hero-actions");
          const shown = hero
            ? hero.getBoundingClientRect().bottom < 48
            : window.scrollY > window.innerHeight * 0.55;
          if (shown) bar.setAttribute("data-shown", "");
          else bar.removeAttribute("data-shown");
        }
      });
    };
    const closeMenus = (except?: Element | null) => {
      document.querySelectorAll<HTMLDetailsElement>("details.tkh-lang[open]").forEach((d) => {
        if (!except || !d.contains(except)) d.open = false;
      });
    };
    const onPointer = (e: PointerEvent) => closeMenus(e.target as Element | null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      closeMenus();
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest("[data-menu-panel]")) active.blur();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
