import { translate, type Lang } from "@/lib/translate";

/** LINE contact for the deployment enquiry · opens in a new tab. */
export const DEMO_LINE_URL = "https://line.me/ti/p/l059F3WkI7";
/** Platform details page. */
export const DEMO_DETAILS_URL = "https://mikaro.studio/teakhouse";

export type DemoStrings = {
  title: string;
  line: string;
  primary: string;
  secondary: string;
  l1: string;
  l2: string;
  l3: string;
  close: string;
};

/**
 * Server-resolved copy for the order funnel · lets the demo bar and order modal
 * follow the site locale without pulling the client i18n provider onto the home
 * LCP path. Strings come from the shared i18n dict (single source).
 */
export function getDemoStrings(locale: Lang): DemoStrings {
  return {
    title: translate(locale, "do.title"),
    line: translate(locale, "do.line"),
    primary: translate(locale, "do.primary"),
    secondary: translate(locale, "do.secondary"),
    l1: translate(locale, "dm.l1"),
    l2: translate(locale, "dm.l2"),
    l3: translate(locale, "dm.l3"),
    close: translate(locale, "mobile.close"),
  };
}
