import { SiteHeader } from "@/components/header/SiteHeader";
import { MobileBookBar } from "@/components/MobileBookBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StaySearch } from "@/components/stay/StaySearch";
import type { Lang } from "@/lib/locales/meta";

/**
 * The guest page frame · all server HTML: the header, the booking bar (a real
 * GET form to /book, on every page that has no booking UI of its own), the
 * page, the footer and the phone Book bar. It used to be a client component
 * that read usePathname() to decide the main padding, the footer and the
 * phone bar; a page now declares those itself with <ChromeMark> and CSS
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
      <StaySearch locale={locale} variant="bar" />
      <main data-guest-main className="pb-24 md:pb-8">
        {children}
      </main>
      <SiteFooter locale={locale} />
      <MobileBookBar locale={locale} />
    </>
  );
}
