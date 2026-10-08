import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { Providers } from "@/components/providers";
import { ChromeMark } from "@/components/site/PageMarks";
import { ACCOUNT_KEYS, messagesFor } from "@/lib/locales";
import { pageLang, type LangParams } from "@/lib/pageLocale";

export function generateMetadata({ params }: { params: LangParams }): Metadata {
  return routeMetadata(pageLang(params), "/account", { robots: { index: false, follow: false } });
}

/** The guest account is client-side (local session), so it brings its providers. */
export default function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: LangParams;
}) {
  const locale = pageLang(params);
  return (
    <Providers initialLang={locale} messages={messagesFor(locale, ACCOUNT_KEYS)}>
      <OwnerStoreProvider>
        <ChromeMark noStayBar />
        {children}
      </OwnerStoreProvider>
    </Providers>
  );
}
