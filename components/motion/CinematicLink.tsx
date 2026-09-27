"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

/**
 * v15 · Cinematic room transitions.
 *
 * A Link that, where the browser supports the View Transitions API, wraps the
 * navigation in `document.startViewTransition`, so an element carrying the
 * same `view-transition-name` on both pages (the room's hero photograph) glides
 * from the card into the detail hero instead of cutting. Everywhere else it is
 * exactly a Link · no polyfill, no layout cost, no JS on the SSR path.
 */
type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

type DocWithVT = Document & { startViewTransition?: (cb: () => void | Promise<void>) => unknown };

export function CinematicLink({ href, onClick, children, ...rest }: Props) {
  const router = useRouter();

  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const doc = document as DocWithVT;
    if (typeof doc.startViewTransition !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    const target = typeof href === "string" ? href : href.pathname ?? "/";
    doc.startViewTransition(() => {
      router.push(target);
      // Give the new route one frame to commit before the snapshot pairs up.
      return new Promise<void>((resolve) => setTimeout(resolve, 60));
    });
  }

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
