const fs = require("fs");
const p = "components/Header.tsx";
let s = fs.readFileSync(p, "utf8");

s = s.replace(
  /import \{ AnimatePresence, m, useReducedMotion \} from "framer-motion";\r?\n/,
  ""
);
s = s.replace(/\s*const reduce = useReducedMotion\(\);\r?\n/g, "\n");

// OffersIconLink still references reduce for pulse — use media-free always-on pulse or css
s = s.replace(
  /\{\s*!reduce \? \(\s*<span className="absolute right-1\.5 top-1\.5 h-1\.5 w-1\.5 animate-\[pulse_2s_ease-in-out_infinite\] rounded-full bg-coral-deep" \/>\s*\) : null\s*\}/,
  `<span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-coral-deep motion-reduce:hidden" />`
);

// Mega menu motion → CSS popover
s = s.replace(
  /<AnimatePresence>\s*\{open \? \(\s*<m\.div([\s\S]*?)initial=\{reduce \? false : \{ opacity: 0, y: 10, scale: 0\.98 \}\}\s*animate=\{\{ opacity: 1, y: 0, scale: 1 \}\}\s*exit=\{reduce \? undefined : \{ opacity: 0, y: 8, scale: 0\.98 \}\}\s*transition=\{\{ type: "spring", stiffness: 280, damping: 24 \}\}\s*className="/,
  `{open ? (\n          <div$1className="tkh-menu-pop `
);

s = s.replace(
  /<m\.div\s+key=\{item\.href\}\s+initial=\{reduce \|\| !drawerOpen \? false : \{ opacity: 0, x: 12 \}\}\s+animate=\{drawerOpen \? \{ opacity: 1, x: 0 \} : undefined\}\s+transition=\{\{ delay: i \* 0\.04, duration: 0\.28 \}\}\s*>/g,
  "<div key={item.href}>"
);

s = s.replace(/<\/m\.div>/g, "</div>");
s = s.replace(/<\/AnimatePresence>\s*/g, "");
s = s.replace(/<AnimatePresence>\s*/g, "");

fs.writeFileSync(p, s);
console.log({
  framer: s.includes("framer-motion"),
  mTag: s.includes("<m."),
  ap: s.includes("AnimatePresence"),
  reduce: s.includes("useReducedMotion") || /\breduce\b/.test(s.match(/OffersIconLink[\s\S]{0,400}/)?.[0] || ""),
});
