import { t } from "@/lib/serverLocale";
import type { Lang } from "@/lib/locales/meta";
import type { StayPickerLabels } from "@/components/stay/StayPicker";

/** The stay picker's words in the page language · handed to the client island. */
export function stayPickerLabels(locale: Lang): StayPickerLabels {
  return {
    title: t(locale, "cal.title"),
    done: t(locale, "cal.done"),
    prev: t(locale, "cal.prev"),
    next: t(locale, "cal.next"),
    from: t(locale, "cal.from"),
    close: t(locale, "cal.close"),
    pickIn: t(locale, "cal.pickIn"),
    pickOut: t(locale, "cal.pickOut"),
  };
}
