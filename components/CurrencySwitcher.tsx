"use client";

import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { CURRENCIES, useCurrency, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

type CurrencySwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function CurrencySwitcher({
  className,
  compact,
}: CurrencySwitcherProps) {
  const { currency, setCurrency } = useCurrency();
  const selected = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <Listbox value={currency} onChange={(v: Currency) => setCurrency(v)}>
      <div className={cn("relative", className)}>
        <ListboxButton
          className={cn(
            "inline-flex items-center gap-1 font-bold text-ink transition hover:text-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-sky",
            compact ? "text-[14px]" : "text-[14px]"
          )}
        >
          <span>{selected.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-sub" aria-hidden />
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute right-0 z-popover mt-2 min-w-[120px] overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl focus:outline-none">
            {CURRENCIES.map((c) => (
              <ListboxOption
                key={c.code}
                value={c.code}
                className={({ active }) =>
                  cn(
                    "relative cursor-pointer select-none px-4 py-2.5 pr-10 text-sm text-ink",
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
      </div>
    </Listbox>
  );
}
