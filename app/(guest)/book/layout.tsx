import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { Providers } from "@/components/providers";
import { ChromeMark } from "@/components/site/PageMarks";
import { BOOK_KEYS, messagesFor } from "@/lib/locales";
import { getServerLocale } from "@/lib/serverLocale";

export function generateMetadata(): Metadata {
  return routeMetadata("/book");
}

/**
 * The booking flow is the one guest page that is a client application, so it
 * mounts its own providers (the guest layout has none): the page language's
 * booking strings, the guest account, and the live room store.
 */
export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getServerLocale();
  return (
    <Providers initialLang={locale} messages={messagesFor(locale, BOOK_KEYS)}>
      <OwnerStoreProvider>
        {/* /book is the booking flow · no second Book bar under it. */}
        <ChromeMark noBookBar flushMain />
        {children}
      </OwnerStoreProvider>
    </Providers>
  );
}
