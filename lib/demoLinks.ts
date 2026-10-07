/**
 * Demo order funnel · the client-safe half (links and the strings' shape).
 * The strings themselves are resolved on the server by lib/demoStrings.ts,
 * which reads the dictionaries; a client component imports only this file.
 */

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
