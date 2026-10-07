import type { Metadata } from "next";
import { routeMetadata } from "@/lib/routeMeta";
import { OwnerStoreProvider } from "@/components/OwnerStoreProvider";
import { Providers } from "@/components/providers";
import { ACCOUNT_KEYS, messagesFor } from "@/lib/locales";
import { getServerLocale } from "@/lib/serverLocale";

export function generateMetadata(): Metadata {
  return routeMetadata("/account", { robots: { index: false, follow: false } });
}

/** The guest account is client-side (local session), so it brings its providers. */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getServerLocale();
  return (
    <Providers initialLang={locale} messages={messagesFor(locale, ACCOUNT_KEYS)}>
      <OwnerStoreProvider>{children}</OwnerStoreProvider>
    </Providers>
  );
}
