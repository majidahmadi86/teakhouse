"use client";

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { InfoTip } from "@/components/owner/InfoTip";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * v18 · The owner panel's shared feedback layer, in the panel's existing
 * design language (owner-panel, own-blue, deal, the red outline buttons):
 *
 *   useToast()       a short message after a save, delete or toggle
 *   useConfirm()     one styled confirm dialog instead of window.confirm
 *   useDirtyGuard()  a form with unsaved changes asks before it is closed or
 *                    the owner navigates away (in-panel links, reload, tab close)
 *
 * Mounted once by OwnerShell. OwnerModal and ModalActions (moved here from the
 * dining page, where they began) are the panel's form dialog.
 */

type Tone = "ok" | "error";
type Toast = { id: number; text: string; tone: Tone };

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger: the confirm button is the red outline style (delete, cancel a stay). */
  tone?: "danger" | "default";
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

type UICtx = {
  toast: (text: string, tone?: Tone) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  setDirty: (id: string, dirty: boolean) => void;
  isDirty: () => boolean;
  confirmDiscard: () => Promise<boolean>;
};

const Ctx = createContext<UICtx | null>(null);

function useUI(): UICtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Owner UI hooks need <OwnerUIProvider>");
  return ctx;
}

export function useToast() {
  return useUI().toast;
}

export function useConfirm() {
  return useUI().confirm;
}

/**
 * Register a form's unsaved state. While any registered form is dirty, a link
 * inside the panel asks before it leaves, and the browser asks before a reload
 * or a closed tab. Returns confirmDiscard() for the form's own close buttons.
 */
export function useDirtyGuard(dirty: boolean) {
  const ui = useUI();
  const id = useId();
  const { setDirty } = ui;
  useEffect(() => {
    setDirty(id, dirty);
  }, [id, dirty, setDirty]);
  useEffect(() => () => setDirty(id, false), [id, setDirty]);
  return { confirmDiscard: ui.confirmDiscard };
}

export function OwnerUIProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const dirtyIds = useRef<Set<string>>(new Set());
  const [dirtyCount, setDirtyCount] = useState(0);
  const nextId = useRef(1);

  const toast = useCallback((text: string, tone: Tone = "ok") => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, text, tone }]);
    window.setTimeout(
      () => setToasts((list) => list.filter((x) => x.id !== id)),
      tone === "error" ? 6500 : 3500
    );
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...opts, resolve });
      }),
    []
  );

  const settle = useCallback((ok: boolean) => {
    setPending((p) => {
      p?.resolve(ok);
      return null;
    });
  }, []);

  const setDirty = useCallback((id: string, dirty: boolean) => {
    const set = dirtyIds.current;
    const had = set.has(id);
    if (dirty && !had) set.add(id);
    else if (!dirty && had) set.delete(id);
    else return;
    setDirtyCount(set.size);
  }, []);

  const isDirty = useCallback(() => dirtyIds.current.size > 0, []);

  const confirmDiscard = useCallback(async () => {
    if (dirtyIds.current.size === 0) return true;
    const ok = await confirm({
      title: t("ow.ui.unsavedTitle"),
      message: t("ow.ui.unsavedBody"),
      confirmLabel: t("ow.ui.discard"),
      cancelLabel: t("ow.ui.keepEditing"),
      tone: "danger",
    });
    if (ok) {
      dirtyIds.current.clear();
      setDirtyCount(0);
    }
    return ok;
  }, [confirm, t]);

  // The browser's own prompt for a reload or a closed tab.
  useEffect(() => {
    if (dirtyCount === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyCount]);

  // In-panel links (the nav, the help links) · caught before next/link acts.
  useEffect(() => {
    if (dirtyCount === 0) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      void confirmDiscard().then((ok) => {
        if (ok) router.push(url.pathname + url.search + url.hash);
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirtyCount, confirmDiscard, router]);

  const value = useMemo<UICtx>(
    () => ({ toast, confirm, setDirty, isDirty, confirmDiscard }),
    [toast, confirm, setDirty, isDirty, confirmDiscard]
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Toasts · above the mobile nav, never over a dialog's buttons. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-modal flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((x) => (
          <div
            key={x.id}
            className={cn(
              "pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.08)]",
              x.tone === "error" && "ring-1 ring-red-500/50"
            )}
          >
            {x.tone === "error" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-deal" aria-hidden />
            )}
            <span>{x.text}</span>
          </div>
        ))}
      </div>

      {/* The one confirm dialog. */}
      <Transition show={pending !== null} as={Fragment}>
        <Dialog onClose={() => settle(false)} className="relative z-modal">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <DialogPanel className="own-theme owner-panel w-full max-w-md rounded-2xl bg-brand p-6">
                <DialogTitle className="font-display text-xl font-semibold text-white">
                  {pending?.title}
                </DialogTitle>
                {pending?.message ? (
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{pending.message}</p>
                ) : null}
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => settle(false)}
                    className="owner-control min-h-[44px] flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white/70"
                  >
                    {pending?.cancelLabel ?? t("ow.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={() => settle(true)}
                    className={cn(
                      "min-h-[44px] flex-1 rounded-xl px-4 py-3 text-sm font-extrabold",
                      pending?.tone === "danger"
                        ? "border border-red-500/40 text-red-300 hover:bg-red-500/10"
                        : "bg-own-blue text-white"
                    )}
                  >
                    {pending?.confirmLabel ?? t("ow.ui.confirm")}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </Ctx.Provider>
  );
}

/**
 * The panel's form dialog. With `dirty`, closing it (the X, Escape, a click
 * outside, Cancel) asks first, and the panel's links ask too.
 */
export function OwnerModal({
  open,
  onClose,
  title,
  dirty = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  dirty?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const { confirmDiscard } = useDirtyGuard(open && dirty);
  const guardedClose = useCallback(() => {
    if (!dirty) {
      onClose();
      return;
    }
    void confirmDiscard().then((ok) => {
      if (ok) onClose();
    });
  }, [dirty, onClose, confirmDiscard]);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={guardedClose} className="relative z-modal">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <DialogPanel className="own-theme owner-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-brand p-6">
              <div className="mb-6 flex items-center justify-between">
                <DialogTitle className="font-display text-xl font-semibold text-white">
                  {title}
                </DialogTitle>
                <button
                  type="button"
                  onClick={guardedClose}
                  aria-label={t("ow.ui.close")}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white/60 hover:bg-white/10"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <OwnerModalClose.Provider value={guardedClose}>{children}</OwnerModalClose.Provider>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

/** The open modal's guarded close · ModalActions' Cancel uses it. */
const OwnerModalClose = createContext<(() => void) | null>(null);

export function ModalActions({
  onCancel,
  onSave,
  cancelLabel,
  saveLabel,
  saving = false,
  error,
}: {
  onCancel: () => void;
  onSave: () => void;
  cancelLabel: string;
  saveLabel: string;
  saving?: boolean;
  /** A message shown above the buttons when the save failed. */
  error?: string;
}) {
  const guardedClose = useContext(OwnerModalClose);
  return (
    <div className="mt-8">
      {error ? <FormError message={error} /> : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={guardedClose ?? onCancel}
          className="owner-control min-h-[44px] flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white/70"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="min-h-[44px] flex-1 rounded-xl bg-own-blue px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

/** A form-level failure, above the actions. */
export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 px-4 py-3 text-sm font-semibold text-red-300"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

/** One field's inline error, under the input. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-semibold text-red-300">{message}</p>;
}

/**
 * The owner form field: label, the optional ? help (ow.tip.*), the control,
 * and an inline error. Replaces the per-page Field helpers.
 */
export function OwnerFormField({
  label,
  tip,
  error,
  children,
  className,
}: {
  label: string;
  tip?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
        <span>{label}</span>
        {tip ? <InfoTip variant="help" label={label} text={tip} /> : null}
      </div>
      {children}
      <FieldError message={error} />
    </div>
  );
}

/** A label row with the ? help, for controls that bring their own label. */
export function TipLabel({ label, tip }: { label: string; tip?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      {tip ? <InfoTip variant="help" label={label} text={tip} /> : null}
    </span>
  );
}
