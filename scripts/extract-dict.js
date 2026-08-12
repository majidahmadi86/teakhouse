const fs = require("fs");
const src = fs.readFileSync("lib/i18n.tsx", "utf8");
const start = src.indexOf("export const DICT");
const end = src.indexOf("/** Overlay brand");
const typeEnd = src.indexOf("type I18nCtx");
if (start < 0 || end < 0 || typeEnd < 0) {
  console.error("markers missing", { start, end, typeEnd });
  process.exit(1);
}
const body = src.slice(start, end);
const overlay = src.slice(end, typeEnd);
const out =
  'import { hotelConfig } from "@/config/hotel.config";\n\n' +
  "export type DictEntry = { en: string; th: string };\n\n" +
  body +
  "\n" +
  overlay +
  "\nexport type { DictEntry as _DictEntry };\n";
fs.writeFileSync("lib/i18n-dict.ts", out);
console.log("wrote lib/i18n-dict.ts", out.length);
