"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";

/**
 * Showcase social sign-in · display capability, non-functional by design.
 * No auth flow, no external calls · a tap shows a toast explaining the buttons
 * are enabled per property on deployment. Official button styling (Google
 * white + 4-colour mark, LINE green). 44px targets, EN + TH.
 */
export function SocialLoginButtons() {
  const { t } = useI18n();
  const [toast, setToast] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => setMounted(true), []);

  const showToast = useCallback(() => {
    setToast(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(false), 2600);
  }, []);

  return (
    <div className="mb-6">
      <div className="space-y-3">
        <button
          type="button"
          onClick={showToast}
          className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-[10px] border-[1.5px] border-line bg-white px-4 text-sm font-bold text-ink transition hover:bg-cloud"
        >
          <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 48 48" aria-hidden>
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          {t("acc.google")}
        </button>

        <button
          type="button"
          onClick={showToast}
          className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-[10px] bg-[#06C755] px-4 text-sm font-bold text-white transition hover:brightness-105"
        >
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 2C6.48 2 2 5.64 2 10.13c0 4.02 3.55 7.39 8.35 8.03.32.07.77.21.88.49.1.25.06.64.03.9l-.14.86c-.04.25-.2.99.87.54 1.07-.45 5.76-3.39 7.86-5.81C21.36 13.51 22 11.9 22 10.13 22 5.64 17.52 2 12 2zM8.16 12.4H6.53c-.24 0-.43-.2-.43-.43V8.72c0-.24.19-.43.43-.43.24 0 .43.19.43.43v2.82h1.2c.24 0 .43.19.43.43 0 .24-.19.43-.43.43zm1.7-.43c0 .23-.2.43-.43.43-.24 0-.43-.2-.43-.43V8.72c0-.24.19-.43.43-.43.23 0 .43.19.43.43v3.25zm3.9 0c0 .19-.12.35-.3.41-.05.02-.1.02-.14.02-.14 0-.27-.06-.35-.18l-1.33-1.81v1.56c0 .23-.2.43-.44.43-.23 0-.43-.2-.43-.43V8.72c0-.19.12-.35.3-.41.04-.02.09-.02.13-.02.14 0 .27.07.35.18l1.34 1.81V8.72c0-.24.19-.43.43-.43.23 0 .43.19.43.43v3.25zm2.62-2.06c.24 0 .43.19.43.43 0 .23-.19.43-.43.43h-1.2v.77h1.2c.24 0 .43.19.43.43 0 .23-.19.43-.43.43h-1.63c-.24 0-.43-.2-.43-.43V8.72c0-.24.19-.43.43-.43h1.63c.24 0 .43.19.43.43 0 .24-.19.43-.43.43h-1.2v.76h1.2z" />
          </svg>
          {t("acc.line")}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-sub">
          {t("acc.orEmail")}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Portalled to body · escapes the AuthShell framer transform so the
          fixed toast anchors to the viewport, not the 400px form container. */}
      {mounted
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className={`z-toast pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4 transition-opacity duration-200 ${
                toast ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-panel">
                {t("acc.socialToast")}
              </span>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
