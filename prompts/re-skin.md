# Re-skin this hotel · Cursor directive

Surgical re-brand. Do not redesign the guest UI. v7 layout, motion, and
composition are blessed. Change identity only.

## Goal
Swap the active hotel preset so the site reads as a different property
(name, palette, photos, contact, policies, concierge voice) without
restyling components.

## Steps
1. Open `config/hotel.config.ts`.
2. Comment the current preset import. Uncomment exactly one of:
   - `./presets/tropical-resort` (The Teak House · current blessed look)
   - `./presets/city-boutique`
   - `./presets/minimal-zen`
3. Or copy an existing preset file to `config/presets/<slug>.ts`, edit
   fields, then point `hotel.config.ts` at it.
4. Keep `HotelConfig` shape in `config/types.ts`. Do not invent new
   top-level keys unless you also thread them through types + callers.
5. Palette: edit `palette` on the preset (CSS vars are applied from
   `hotelConfig.palette` in `app/layout.tsx`). Do not hardcode colors
   into guest components.
6. Photos: replace Unsplash URLs in `photos.hero`, `photos.gallery`,
   `photos.about`. Prefer real property photography when available.
7. Concierge: update `concierge.name`, `hello`, `fallback`, `facts`.
   English first. Do not invent new Thai strings here · reuse existing
   Thai or request Thai from Claude.
8. Re-seed if room names/rates must match the new brand:
   `npm run db:seed` (or `npm run db:reset` in demo).
9. Smoke: home hero brand, `/rooms`, `/book`, concierge hello, owner
   shell title.

## Hard rules
- No em-dash. Use · or commas.
- No emojis.
- No guest restyle (no new cards in hero, no purple theme, no Inter).
- English-only for any new admin/demo UI copy.
- Do not merge to main. Do not deploy unless Mike confirms.

## Done when
First viewport still reads as one composition · brand is hero-level ·
palette and name match the new preset · booking and owner still work.
