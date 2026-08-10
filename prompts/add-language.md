# Add a language · Cursor directive

Extend i18n without authoring Thai (or other non-English) copy in this
agent. English admin strings only unless Claude supplies the locale.

## Goal
Add a locale code to the guest site dictionary and language switcher,
wired through `hotelConfig.languages` and `lib/i18n.tsx`.

## Steps
1. Decide the locale code (e.g. `zh`, `ja`). Keep it short and stable.
2. Update `HotelConfig.languages` in `config/types.ts` and every active
   preset in `config/presets/*` that should expose the language.
3. Extend `DICT` entries in `lib/i18n.tsx`. Shape is per-key objects
   keyed by locale. Add the new key beside `en` / `th`.
4. For guest copy in the new language: STOP if you would invent it.
   Request translations from Claude. Until then, fall back to `en` for
   missing keys (implement a safe fallback in the `t()` helper if not
   already present).
5. Concierge chips / intents (`lib/conciergeIntents.ts`): add the new
   locale only when translations are provided. Do not machine-author
   Thai or other locales here.
6. Fonts: if the locale needs a distinct face, add it via next/font in
   layout and map it in the preset `fonts` block · keep display/sans
   expressive (no Inter / Roboto / Arial).
7. Smoke: switcher toggles, `/book` labels, concierge hello, owner
   remains English-only unless explicitly scoped.

## Hard rules
- Grok / this agent does not author new Thai (or other non-English)
  UI strings. Request them.
- New admin/demo strings: English only.
- No em-dash. No emojis.
- Do not restyle the guest shell for language work.

## Done when
Switcher lists the locale, missing keys fall back safely, and no
unverified translations were invented in this pass.
