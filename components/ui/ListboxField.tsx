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
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div
          className={cn(
            "mb-2 text-sm font-semibold text-ink",
            labelClassName
          )}
        >
          {label}
        </div>
      ) : null}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left text-base text-ink transition hover:border-blue/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2">
            <span>{selected?.label ?? value}</span>
            <ChevronDown className="h-5 w-5 shrink-0 text-strike" aria-hidden />
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-line bg-white py-2 shadow-xl focus:outline-none">
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    cn(
                      "relative cursor-pointer select-none px-4 py-3 pr-10 text-base text-ink",
                      active && "bg-deal-bg"
                    )
                  }
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span className={cn(isSelected && "font-semibold text-blue")}>
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
        </div>
      </Listbox>
    </div>
  );
}
