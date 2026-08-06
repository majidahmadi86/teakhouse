"use client";

import { Fragment, useRef } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { CURRENCIES, useCurrency, type Currency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type CurrencySwitcherProps = {
  className?: string;
  /** Bottom-sheet portal for mobile drawer (avoids clipped dropdown). */
  sheet?: boolean;
};

export function CurrencySwitcher({
  className,
  sheet = false,
}: CurrencySwitcherProps) {
  const { currency, setCurrency } = useCurrency();
  const { lang } = useI18n();
  const doneRef = useRef<HTMLElement>(null);
  const selected = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const doneLabel = lang === "th" ? "เสร็จสิ้น" : "Done";

  /** Re-select current value via ListboxOption — closes sheet even when inert. */
  function closeSheet() {
    doneRef.current?.click();
  }

  return (
    <Listbox value={currency} onChange={(v: Currency) => setCurrency(v)}>
      {({ open }) => (
        <div className={cn("relative", className)}>
          <ListboxButton
            aria-label={`Currency ${selected.label}`}
            className={cn(
              "icon-hit inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[13px] font-bold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sky"
            )}
          >
            <span>{selected.label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sub" aria-hidden />
          </ListboxButton>

          {sheet ? (
            <Transition show={open} as={Fragment}>
              <ListboxOptions
                static
                portal
                modal
                className="fixed inset-0 z-[80] flex flex-col justify-end focus:outline-none"
              >
                <button
                  type="button"
                  className="absolute inset-0 z-0 bg-navy/40"
                  aria-label={lang === "th" ? "ปิด" : "Close"}
                  onClick={closeSheet}
                />
                <div className="relative z-10 rounded-t-3xl bg-white px-2 pb-safe pt-3 shadow-2xl">
                  <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-line" />
                  <div className="py-2">
                    {CURRENCIES.map((c) => (
                      <ListboxOption
                        key={c.code}
                        value={c.code}
                        className={({ active, selected: isSelected }) =>
                          cn(
                            "relative cursor-pointer select-none px-4 py-3.5 pr-10 text-base text-ink",
                            active && "bg-sky",
                            isSelected && "font-semibold text-blue"
                          )
                        }
                      >
                        {({ selected: isSelected }) => (
                          <>
                            <span>{c.label}</span>
                            {isSelected ? (
                              <span className="absolute inset-y-0 right-3 flex items-center text-blue">
                                <Check className="h-5 w-5" aria-hidden />
                              </span>
                            ) : null}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </div>
                  <div className="px-3 pb-3 pt-1">
                    <ListboxOption
                      ref={doneRef}
                      value={currency}
                      className="btn-primary w-full cursor-pointer"
                    >
                      {doneLabel}
                    </ListboxOption>
                  </div>
                </div>
              </ListboxOptions>
            </Transition>
          ) : (
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions
                portal
                anchor={{ to: "bottom end", gap: "8px", padding: "12px" }}
                className="z-[80] min-w-[120px] overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <ListboxOption
                    key={c.code}
                    value={c.code}
                    className={({ active }) =>
                      cn(
                        "relative cursor-pointer select-none px-4 py-2.5 pr-10 text-sm whitespace-nowrap text-ink",
                        active && "bg-sky"
                      )
                    }
                  >
                    {({ selected: isSelected }) => (
                      <>
                        <span
                          className={cn(isSelected && "font-semibold text-blue")}
                        >
                          {c.label}
                        </span>
                        {isSelected ? (
                          <span className="absolute inset-y-0 right-3 flex items-center text-blue">
                            <Check className="h-4 w-4" aria-hidden />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          )}
        </div>
      )}
    </Listbox>
  );
}
