import { SiteHeader } from "@/components/header/SiteHeader";
import { MobileBookBar } from "@/components/MobileBookBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import type { Lang } from "@/lib/locales/meta";

/**
 * The guest page frame · all server HTML. It used to be a client component
 * that read usePathname() to decide the main padding, the footer and the
 * phone Book bar; a page now declares those itself with <ChromeMark> and CSS
 * applies them (app/globals.css, "Page chrome"), so the frame renders the
 * same on the server, in the browser and in every language.
 */
export function GuestShell({
  locale,
  children,
}: {
  locale: Lang;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader locale={locale} />
      <main data-guest-main className="pb-24 md:pb-8">
        {children}
      </main>
      <SiteFooter locale={locale} />
      <MobileBookBar locale={locale} />
    </>
  );
}
