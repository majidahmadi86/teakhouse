import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { Providers } from "@/components/providers";
import { ChromeMark } from "@/components/site/PageMarks";
import { BOOK_KEYS, messagesFor } from "@/lib/locales";
import { pageLang, type LangParams } from "@/lib/pageLocale";

export function generateMetadata({ params }: { params: LangParams }): Metadata {
  return routeMetadata(pageLang(params), "/book");
}

/**
 * The booking flow is the one guest page that is a client application, so it
 * mounts its own providers (the guest layout has none): the page language's
 * booking strings, the guest account, and the live room store.
 */
export default function BookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LangParams;
}) {
  const locale = pageLang(params);
  return (
    <Providers initialLang={locale} messages={messagesFor(locale, BOOK_KEYS)}>
      <OwnerStoreProvider>
        {/* /book is the booking flow · no second Book bar under it. */}
        <ChromeMark noBookBar noStayBar flushMain />
        {children}
      </OwnerStoreProvider>
    </Providers>
  );
}
