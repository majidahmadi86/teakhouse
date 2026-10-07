"use client";

import { ConciergeProvider } from "@/components/providers";
import { CurrencyProvider } from "@/lib/currency";
import { GuestAuthProvider } from "@/lib/guestAuth";
import { DICT } from "@/lib/i18n-dict";
import { I18nProvider, type Lang, type Messages } from "@/lib/i18n";

/**
 * The owner panel's providers · unchanged in behaviour from v14.
 *
 * The panel is EN/TH and switches language in place, so it keeps the bilingual
 * dictionary in its OWN bundle (this module), exactly as before. Guest pages
 * never import this file, so no guest bundle carries a dictionary.
 */
const cache = new Map<string, Messages>();

function ownerMessages(lang: Lang): Messages {
  const slot = lang === "th" ? "th" : "en";
  const hit = cache.get(slot);
  if (hit) return hit;
  const out: Messages = {};
  for (const [k, v] of Object.entries(DICT)) out[k] = v[slot];
  cache.set(slot, out);
  return out;
}

export function OwnerProviders({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
}) {
  return (
    <I18nProvider initialLang={initialLang} messagesForLang={ownerMessages}>
      <CurrencyProvider>
        <GuestAuthProvider>
          <ConciergeProvider>{children}</ConciergeProvider>
        </GuestAuthProvider>
      </CurrencyProvider>
    </I18nProvider>
  );
}
