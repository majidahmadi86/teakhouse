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
import { DICT, type DictEntry } from "./i18n-dict";

export type Lang = "en" | "th";
export type { DictEntry };
export { DICT };

/** Single source of truth · mirrors lib/serverLocale.ts. */
export const LOCALE_COOKIE = "tkh-lang";
const LANG_EVENT = "tkh:lang";

function readCookieLang(): Lang | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)tkh-lang=(en|th)\b/);
  return m ? (m[1] as Lang) : null;
}

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tr: (entry: DictEntry) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

/**
 * Locale is server-resolved from the tkh-lang cookie. On SSR'd trees it is
 * handed in as initialLang (no English-first flash); deferred client islands
 * seed from the cookie at mount. Toggling writes the cookie, broadcasts a
 * tkh:lang event so every mounted provider (header, booking pill, …) stays in
 * sync, and router.refresh()es so all server-rendered text re-renders · one
 * atomic switch, no reload, no mixed language.
 */
export function I18nProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(
    () => initialLang ?? readCookieLang() ?? "en"
  );
  const router = useRouter();

  useEffect(() => {
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail === "en" || detail === "th") setLangState(detail);
    };
    window.addEventListener(LANG_EVENT, onLang as EventListener);
    return () => window.removeEventListener(LANG_EVENT, onLang as EventListener);
  }, []);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      try {
        document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = l;
        window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: l }));
      } catch {
        /* ignore */
      }
      router.refresh();
    },
    [router]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const d = DICT[key];
      let s = d ? d[lang] : key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          s = s.replace(`{${k}}`, String(v));
        });
      }
      return s;
    },
    [lang]
  );

  const tr = useCallback((entry: DictEntry) => entry[lang], [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, tr }),
    [lang, setLang, t, tr]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
