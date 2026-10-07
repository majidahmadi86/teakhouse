"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { interpolate, translateEntry, type DictEntry } from "./i18n-core";
import { isLang, LOCALE_COOKIE, type Lang } from "./locales/meta";

export type { Lang, DictEntry };
export { LOCALE_COOKIE };

/** One language's strings, flat · computed on the server by messagesFor(). */
export type Messages = Record<string, string>;

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tr: (entry: DictEntry) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

/**
 * The client receives ONE language's strings (`messages`, computed on the
 * server by lib/locales messagesFor) instead of every dictionary, so no guest
 * bundle carries a dictionary.
 *
 * Changing language on a guest page is a full navigation to `?lang=xx`: the
 * middleware promotes it into the cookie and serves that language's static
 * page, so a tree is never half one language and half another.
 *
 * The owner panel (lib/ownerI18n.tsx) passes `messagesForLang` instead · it
 * keeps its EN/TH dictionary in its own bundle as before and switches in place
 * (cookie + router.refresh), unchanged from v14.
 */
export function I18nProvider({
  children,
  initialLang,
  messages,
  messagesForLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
  messages?: Messages;
  messagesForLang?: (l: Lang) => Messages;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  useEffect(() => {
    if (isLang(initialLang)) setLangState(initialLang);
  }, [initialLang]);

  const dict = useMemo<Messages>(
    () => (messagesForLang ? messagesForLang(lang) : messages ?? {}),
    [messagesForLang, messages, lang]
  );

  const setLang = useCallback(
    (l: Lang) => {
      if (!isLang(l)) return;
      if (messagesForLang) {
        setLangState(l);
        try {
          document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
          document.documentElement.lang = l;
        } catch {
          /* ignore */
        }
        router.refresh();
        return;
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", l);
        window.location.assign(url.toString());
      } catch {
        /* ignore */
      }
    },
    [messagesForLang, router]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      interpolate(dict[key] ?? key, vars),
    [dict]
  );

  const tr = useCallback((entry: DictEntry) => translateEntry(lang, entry), [lang]);

  const value = useMemo(() => ({ lang, setLang, t, tr }), [lang, setLang, t, tr]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
