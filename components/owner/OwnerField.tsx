"use client";

import { DateRangePicker } from "@/components/ui/DateRangePicker";
import {
  ListboxField,
  type ListboxOptionItem,
} from "@/components/ui/ListboxField";
import { cn } from "@/lib/utils";

/** Dark-theme shell for owner selects. Panel stays white via portal. */
const fieldClass = "own-select w-full";

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
        labelClassName="text-white/80"
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
