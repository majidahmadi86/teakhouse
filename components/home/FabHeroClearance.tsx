"use client";

import { useEffect } from "react";

/**
 * v14 · Keeps the concierge FAB off the home hero's booking widget on phones.
 *
 * The FAB ships compact (icon only) from the server · that is the safe state,
 * and it is what a guest sees if this script never runs, fails, or the browser
 * has no IntersectionObserver. This only ever EXPANDS the button back to its
 * labelled form, and only once the booking widget has left the viewport.
 *
 * No state, no render: it toggles one attribute on an element that already
 * exists in the HTML, so there is nothing to hydrate and no layout to shift.
 */
export function FabHeroClearance() {
  useEffect(() => {
    const fab = document.querySelector<HTMLElement>("[data-concierge-fab]");
    const hero = document.querySelector("#tkh-hero-actions");
    if (!fab || !hero || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fab.removeAttribute("data-fab-expanded");
        else fab.setAttribute("data-fab-expanded", "");
      },
      // A slice of the widget still counts as present · expanding the moment
      // its last pixel clears would put the label back under the guest's thumb.
      { threshold: 0, rootMargin: "0px 0px -12px 0px" }
    );

    observer.observe(hero);
    return () => {
      observer.disconnect();
      fab.removeAttribute("data-fab-expanded");
    };
  }, []);

  return null;
}
