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
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

export type ListboxOptionItem = {
  value: string;
  label: string;
};

type ListboxFieldProps = {
  value: string;
  onChange: (value: string) => void;
  options: ListboxOptionItem[];
  label?: string;
  labelClassName?: string;
  className?: string;
};

export function ListboxField({
  value,
  onChange,
  options,
  label,
  labelClassName,
  className,
}: ListboxFieldProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const selected = options.find((o) => o.value === value);
  const doneLabel = t("drp.done");

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div
          className={cn("mb-2 text-sm font-semibold text-ink", labelClassName)}
        >
          {label}
        </div>
      ) : null}
      <Listbox value={value} onChange={onChange}>
        {({ open }) => (
          <div className="relative">
            <ListboxButton className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left text-base text-ink transition hover:border-blue/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2">
              <span>{selected?.label ?? value}</span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-strike"
                aria-hidden
              />
            </ListboxButton>

            {isMobile ? (
              <Transition show={open} as={Fragment}>
                <ListboxOptions
                  static
                  portal
                  modal
                  className="fixed inset-0 z-popover flex flex-col justify-end focus:outline-none"
                >
                  <div className="absolute inset-0 bg-navy/40" aria-hidden />
                  <div className="relative rounded-t-3xl bg-white px-2 pb-safe pt-3 shadow-2xl">
                    <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-line" />
                    <div className="max-h-[50vh] overflow-auto py-2">
                      {options.map((option) => (
                        <ListboxOption
                          key={option.value}
                          value={option.value}
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
                              <span>{option.label}</span>
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
                      <button type="button" className="btn-primary w-full">
                        {doneLabel}
                      </button>
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
                  anchor={{ to: "bottom start", gap: "8px", padding: "12px" }}
                  className="z-popover max-h-60 w-[var(--button-width)] overflow-auto rounded-2xl border border-line bg-white py-2 shadow-xl focus:outline-none"
                >
                  {options.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        cn(
                          "relative cursor-pointer select-none px-4 py-3 pr-10 text-base text-ink",
                          active && "bg-sky"
                        )
                      }
                    >
                      {({ selected: isSelected }) => (
                        <>
                          <span
                            className={cn(
                              isSelected && "font-semibold text-blue"
                            )}
                          >
                            {option.label}
                          </span>
                          {isSelected ? (
                            <span className="absolute inset-y-0 right-3 flex items-center text-blue">
                              <Check className="h-5 w-5" aria-hidden />
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
    </div>
  );
}
