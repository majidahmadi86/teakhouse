"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { useConcierge } from "@/components/providers";
import { useI18n } from "@/lib/i18n";
import {
  CONCIERGE_CHIPS,
  CONCIERGE_FALLBACK,
  CONCIERGE_HELLO,
  matchConciergeIntent,
} from "@/lib/conciergeIntents";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "ai" | "user";
  html: string;
  time: string;
};

function nowLabel(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Chat panel only · loaded after idle or first FAB interaction. */
export function ConciergePanel({
  offsetForBookBar = true,
}: {
  offsetForBookBar?: boolean;
}) {
  const { lang, t } = useI18n();
  const { isOpen, prefill, closeConcierge } = useConcierge();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);
  const handledPrefill = useRef("");

  const pick = useCallback(
    (entry: { en: string; th: string }) => entry[lang],
    [lang]
  );

  const pushAi = useCallback((html: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-ai`, role: "ai", html, time: nowLabel() },
    ]);
  }, []);

  const localReply = useCallback(
    (text: string) => pick(matchConciergeIntent(text) ?? CONCIERGE_FALLBACK),
    [pick]
  );

  const respond = useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-u`, role: "user", html: text, time: nowLabel() },
      ]);
      setTyping(true);

      const controller = new AbortController();
      const kill = window.setTimeout(() => controller.abort(), 8000);

      void (async () => {
        try {
          const res = await fetch("/api/concierge", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: text, lang }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`concierge ${res.status}`);
          const data = (await res.json()) as { reply?: string };
          if (!data.reply?.trim()) throw new Error("empty reply");
          pushAi(data.reply.trim());
        } catch {
          // AI unavailable / network / 503 · keep existing intent matcher
          pushAi(localReply(text));
        } finally {
          window.clearTimeout(kill);
          setTyping(false);
        }
      })();
    },
    [lang, localReply, pushAi]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!greeted.current) {
      greeted.current = true;
      pushAi(pick(CONCIERGE_HELLO));
    }
  }, [isOpen, pick, pushAi]);

  useEffect(() => {
    if (!isOpen || !prefill || prefill === handledPrefill.current) return;
    handledPrefill.current = prefill;
    respond(prefill);
  }, [isOpen, prefill, respond]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const chips = CONCIERGE_CHIPS[lang];

  return (
    <div
      className={cn(
        "fixed z-drawer flex flex-col overflow-hidden bg-white shadow-[0_30px_80px_rgba(18,33,28,0.35)] transition duration-300",
        // Mobile · full-height bottom sheet
        "inset-x-0 bottom-0 h-[90dvh] w-full rounded-t-[20px]",
        // Desktop · floating right panel (blessed)
        "md:inset-x-auto md:right-[22px] md:bottom-6 md:h-[min(560px,72svh)] md:w-[min(390px,calc(100vw-32px))] md:rounded-[20px]",
        isOpen
          ? "pointer-events-auto translate-y-0 opacity-100 md:scale-100"
          : "pointer-events-none translate-y-full opacity-0 md:translate-y-4 md:scale-[0.98]"
      )}
      role="dialog"
      aria-label={t("a11y.conciergeChat")}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center gap-3 bg-navy px-5 py-4 text-white">
        <div className="grid h-[38px] w-[38px] place-items-center rounded-full bg-blue font-display text-lg font-semibold">
          N
        </div>
        <div className="min-w-0 flex-1">
          <b className="block text-[0.95rem]">{t("cg.name")}</b>
          <span className="flex items-center gap-1.5 text-[0.72rem] opacity-75">
            <i className="h-[7px] w-[7px] rounded-full bg-[#7FD79A]" aria-hidden />
            {t("cg.online")}
          </span>
        </div>
        <button
          type="button"
          onClick={closeConcierge}
          className="opacity-80"
          aria-label={t("mobile.close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={bodyRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-surface-2 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[82%] rounded-[15px] px-4 py-3 text-[0.9rem] leading-relaxed",
              msg.role === "ai"
                ? "bg-white shadow-sm"
                : "ml-auto bg-navy text-white"
            )}
          >
            {msg.role === "ai" ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: msg.html.replace(
                    'class="font-extrabold text-blue"',
                    'style="color:#B9853D;font-weight:800"'
                  ),
                }}
              />
            ) : (
              msg.html
            )}
            <span className="mt-1 block text-[0.62rem] opacity-50">{msg.time}</span>
          </div>
        ))}
        {typing ? (
          <div className="inline-flex gap-1 rounded-[15px] bg-white px-4 py-3.5 shadow-sm">
            {[0, 1, 2].map((i) => (
              <i
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-strike"
                style={{ animationDelay: `${i * 0.18}s` }}
                aria-hidden
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 bg-surface-2 px-4 py-2.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => respond(chip)}
            className="rounded-full border border-blue/25 bg-white px-3 py-1.5 text-[0.76rem] font-bold text-blue hover:bg-line/50"
          >
            {chip}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2.5 border-t border-line bg-white px-3.5 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text) return;
          setInput("");
          respond(text);
        }}
      >
        <label className="sr-only" htmlFor="concierge-input">
          {t("cg.ph")}
        </label>
        <input
          id="concierge-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("cg.ph")}
          className="min-w-0 flex-1 border-0 bg-transparent px-1.5 py-2.5 text-[0.92rem] outline-none"
        />
        <button
          type="submit"
          className="grid h-11 w-11 place-items-center rounded-[10px] bg-blue text-white"
          aria-label={t("a11y.send")}
        >
          <Send className="h-[18px] w-[18px]" />
        </button>
      </form>
    </div>
  );
}
