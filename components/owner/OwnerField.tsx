"use client";

import { DateRangePicker } from "@/components/ui/DateRangePicker";
import {
  ListboxField,
  type ListboxOptionItem,
} from "@/components/ui/ListboxField";
import { cn } from "@/lib/utils";

const fieldClass =
  "[&_button]:min-h-[44px] [&_button]:border-white/15 [&_button]:bg-white/8 [&_button]:text-white [&_button]:hover:border-own-blue/40 [&_span.text-strike]:text-white/40 [&_.text-ink]:text-white [&_label]:text-white/80 [&_svg]:text-gold/70";

type OwnerListboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: ListboxOptionItem[];
  label?: string;
  className?: string;
};

export function OwnerListbox({
  value,
  onChange,
  options,
  label,
  className,
}: OwnerListboxProps) {
  return (
    <div className={cn(fieldClass, className)}>
      <ListboxField
        value={value}
        onChange={onChange}
        options={options}
        label={label}
      />
    </div>
  );
}

type OwnerDateRangeProps = {
  from?: Date;
  to?: Date;
  onChange: (from: Date | undefined, to: Date | undefined) => void;
  placeholder?: string;
  className?: string;
};

export function OwnerDateRange({
  from,
  to,
  onChange,
  placeholder,
  className,
}: OwnerDateRangeProps) {
  return (
    <div className={cn(fieldClass, className)}>
      <DateRangePicker
        from={from}
        to={to}
        onChange={onChange}
        placeholder={placeholder}
        numberOfMonths={1}
      />
    </div>
  );
}
