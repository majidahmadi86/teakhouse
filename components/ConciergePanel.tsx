"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Send, Sparkles, X } from "lucide-react";
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
  role: "ai" | "user" | "action";
  html: string;
  time: string;
  streaming?: boolean;
};

type Stay = { code: string; roomEn: string; roomTh: string; checkIn: string; checkOut: string; status: string };

const STAY_KEY = "tkh-stay";

const STAY_CHIPS = {
  en: ["Breakfast to my room at 07:30", "Book a spa slot this evening", "Airport car for my departure", "Plan my day on the river"],
  th: ["ส่งอาหารเช้าที่ห้อง 07:30", "จองสปาช่วงเย็นนี้", "รถไปสนามบินวันเดินทาง", "วางแผนเที่ยวริมน้ำวันนี้"],
};

function nowLabel(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function readStoredStay(): string {
  try {
    return localStorage.getItem(STAY_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Chat panel · loaded after idle or first FAB interaction.
 *
 * v15 · streams the reply as it is written, keeps the last turns so the
 * concierge remembers the thread, and, once a booking code is verified, files
 * real requests with the desk (breakfast, spa, transfers, itinerary) and shows
 * each one as a card in the conversation.
 */
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
  const [stay, setStay] = useState<Stay | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);
  const handledPrefill = useRef("");
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const pick = useCallback((entry: { en: string; th: string }) => entry[lang === "th" ? "th" : "en"], [lang]);

  const pushAi = useCallback((html: string) => {
    setMessages((prev) => [...prev, { id: `${Date.now()}-ai`, role: "ai", html, time: nowLabel() }]);
    historyRef.current = [...historyRef.current, { role: "assistant" as const, content: html.replace(/<[^>]+>/g, "") }].slice(-6);
  }, []);

  const localReply = useCallback(
    (text: string) => pick(matchConciergeIntent(text) ?? CONCIERGE_FALLBACK),
    [pick]
  );

  /** Verify a booking code with the house · unlocks in-stay requests. */
  const verifyStay = useCallback(async (code: string): Promise<boolean> => {
    const clean = code.trim().toUpperCase();
    if (!clean) return false;
    try {
      const res = await fetch(`/api/concierge?code=${encodeURIComponent(clean)}`);
      if (!res.ok) return false;
      const data = (await res.json()) as Stay & { valid: boolean };
      if (!data.valid) return false;
      setStay(data);
      try {
        localStorage.setItem(STAY_KEY, data.code);
      } catch {
        /* ignore */
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const stored = readStoredStay();
    if (stored) void verifyStay(stored);
  }, [verifyStay]);

  const respond = useCallback(
    (text: string) => {
      setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: "user", html: text, time: nowLabel() }]);
      const history = historyRef.current;
      historyRef.current = [...history, { role: "user" as const, content: text }].slice(-6);
      setTyping(true);

      const controller = new AbortController();
      const kill = window.setTimeout(() => controller.abort(), 25000);
      const aiId = `${Date.now()}-ai`;
      let started = false;
      let assembled = "";

      const appendDelta = (delta: string) => {
        assembled += delta;
        if (!started) {
          started = true;
          setTyping(false);
          setMessages((prev) => [...prev, { id: aiId, role: "ai", html: assembled, time: nowLabel(), streaming: true }]);
        } else {
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, html: assembled } : m)));
        }
      };
      const finish = () => {
        setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, streaming: false } : m)));
        historyRef.current = [...historyRef.current, { role: "assistant" as const, content: assembled.replace(/<[^>]+>/g, "") }].slice(-6);
      };

      void (async () => {
        try {
          const res = await fetch("/api/concierge", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: text, lang, stream: true, bookingCode: stay?.code, history }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`concierge ${res.status}`);
          const ctype = res.headers.get("content-type") ?? "";
          if (!ctype.includes("text/event-stream")) {
            const data = (await res.json()) as { reply?: string; actions?: { request: { title: string; kind: string } }[] };
            if (!data.reply?.trim()) throw new Error("empty reply");
            for (const a of data.actions ?? []) pushAction(a.request);
            appendDelta(data.reply.trim());
            finish();
            return;
          }
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
              const raw = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 2);
              const line = raw.split("\n").find((l) => l.startsWith("data:"));
              if (!line) continue;
              const frame = JSON.parse(line.slice(5)) as
                | { type: "delta"; text: string }
                | { type: "action"; request: { title: string; kind: string } }
                | { type: "done" };
              if (frame.type === "delta") appendDelta(frame.text);
              else if (frame.type === "action") pushAction(frame.request);
            }
          }
          if (!started) appendDelta(localReply(text));
          finish();
        } catch {
          if (!started) {
            appendDelta(localReply(text));
            finish();
          }
        } finally {
          window.clearTimeout(kill);
          setTyping(false);
        }
      })();

      function pushAction(request: { title: string; kind: string }) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-act-${Math.random()}`,
            role: "action",
            html: `${t(`cg.req.kind.${request.kind}`)} · ${request.title}`,
            time: nowLabel(),
          },
        ]);
      }
    },
    [lang, localReply, stay?.code, t]
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

  const chipLang = lang === "th" ? "th" : "en";
  const chips = stay ? STAY_CHIPS[chipLang] : CONCIERGE_CHIPS[chipLang];

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const ok = await verifyStay(codeInput);
    setCodeError(!ok);
    if (ok) {
      setCodeOpen(false);
      setCodeInput("");
      pushAi(t("cg.stay.linked"));
    }
  }

  function forgetStay() {
    setStay(null);
    try {
      localStorage.removeItem(STAY_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={cn(
        "fixed z-drawer flex flex-col overflow-hidden bg-white shadow-[0_30px_80px_rgba(18,33,28,0.35)] transition duration-300",
        "inset-x-0 bottom-0 h-[90dvh] w-full rounded-t-[20px]",
        "md:inset-x-auto md:right-[22px] md:bottom-6 md:h-[min(600px,76svh)] md:w-[min(400px,calc(100vw-32px))] md:rounded-[20px]",
        isOpen
          ? "pointer-events-auto translate-y-0 opacity-100 md:scale-100"
          : "pointer-events-none translate-y-full opacity-0 md:translate-y-4 md:scale-[0.98]"
      )}
      role="dialog"
      aria-label={t("a11y.conciergeChat")}
      aria-hidden={!isOpen}
      data-offset-bookbar={offsetForBookBar ? "" : undefined}
    >
      <div className="flex items-center gap-3 bg-navy px-5 py-4 text-white">
        <div className="grid h-[38px] w-[38px] place-items-center rounded-full bg-gold font-display text-lg font-semibold text-navy">
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
          onClick={() => setCodeOpen((v) => !v)}
          className={cn(
            "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-[0.72rem] font-bold transition",
            stay ? "border-gold/60 bg-gold/15 text-gold" : "border-white/25 text-white/85 hover:bg-white/10"
          )}
          aria-expanded={codeOpen}
          data-concierge-stay
        >
          <KeyRound className="h-3.5 w-3.5" aria-hidden />
          {stay ? stay.code : t("cg.stay.link")}
        </button>
        <button type="button" onClick={closeConcierge} className="opacity-80" aria-label={t("mobile.close")}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {codeOpen ? (
        <form onSubmit={submitCode} className="flex flex-wrap items-center gap-2 border-b border-line bg-cloud px-4 py-3">
          {stay ? (
            <>
              <p className="min-w-0 flex-1 text-[0.8rem] font-semibold text-ink">
                {lang === "th" ? stay.roomTh : stay.roomEn} · {stay.checkIn} → {stay.checkOut}
              </p>
              <button type="button" onClick={forgetStay} className="text-[0.76rem] font-bold text-sub hover:text-ink">
                {t("cg.stay.forget")}
              </button>
            </>
          ) : (
            <>
              <label className="sr-only" htmlFor="concierge-code">
                {t("cg.stay.codeLabel")}
              </label>
              <input
                id="concierge-code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="TKH-1234"
                className={cn("min-h-[40px] min-w-0 flex-1 px-3 text-sm font-semibold uppercase", codeError && "border-coral-deep")}
                autoComplete="off"
              />
              <button type="submit" className="min-h-[40px] rounded-[10px] bg-navy px-4 text-sm font-bold text-white">
                {t("cg.stay.verify")}
              </button>
              {codeError ? <p className="w-full text-[0.74rem] font-semibold text-coral-deep">{t("cg.stay.invalid")}</p> : null}
            </>
          )}
        </form>
      ) : null}

      <div ref={bodyRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-surface-2 p-4">
        {messages.map((msg) =>
          msg.role === "action" ? (
            <div
              key={msg.id}
              className="flex items-start gap-2 self-stretch rounded-[12px] border border-gold/40 bg-gold/10 px-3.5 py-2.5 text-[0.82rem] font-semibold text-ink"
              data-concierge-action
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              <span>
                <span className="block text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-gold">{t("cg.req.sentToDesk")}</span>
                {msg.html}
              </span>
            </div>
          ) : (
            <div
              key={msg.id}
              className={cn(
                "max-w-[84%] rounded-[15px] px-4 py-3 text-[0.9rem] leading-relaxed",
                msg.role === "ai" ? "bg-white shadow-sm" : "ml-auto bg-navy text-white"
              )}
            >
              {msg.role === "ai" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: msg.html.replace('class="font-extrabold text-blue"', 'style="color:#B9853D;font-weight:800"'),
                  }}
                />
              ) : (
                msg.html
              )}
              <span className="mt-1 block text-[0.62rem] opacity-50">{msg.streaming ? "…" : msg.time}</span>
            </div>
          )
        )}
        {typing ? (
          <div className="inline-flex gap-1 rounded-[15px] bg-white px-4 py-3.5 shadow-sm">
            {[0, 1, 2].map((i) => (
              <i key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-strike" style={{ animationDelay: `${i * 0.18}s` }} aria-hidden />
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
        <button type="submit" className="grid h-11 w-11 place-items-center rounded-[10px] bg-blue text-white" aria-label={t("a11y.send")}>
          <Send className="h-[18px] w-[18px]" />
        </button>
      </form>
    </div>
  );
}
