# v12 · new dictionary keys + DB seed strings awaiting a Thai pass

Every key below currently carries its **English** copy in the `th` slot.
Nothing here was authored in Thai.

**Not in this list** (already Thai, supplied verbatim by the v12 directive):
the eight owner metric info tips `ow.tip.s1` `ow.tip.s2` `ow.tip.s3`
`ow.tip.s4` `ow.tip.month` `ow.tip.occ` `ow.tip.adr` `ow.tip.bookings`.
Also `ow.avail.hNext` ("Next {n} days"), whose Thai `{n} วันข้างหน้า` is the
certified `ow.next7` string with the numeral parameterized · no new Thai was
authored.

## Dictionary keys (`lib/i18n-dict.ts`)

| Key | English value |
| --- | --- |
| **Navigation** | |
| `nav.dining` | Dining |
| `nav.events` | Events & Spaces |
| `ow.dining` | Dining |
| `ow.events` | Events |
| **Owner availability control** | |
| `ow.avail.prev` | Previous month |
| `ow.avail.next` | Next month |
| `ow.avail.days` | {n} days |
| `ow.avail.today` | Today |
| **Dining page** | |
| `dn.h1` | The kitchen by the river |
| `dn.lead` | One long menu from morning rice soup to the last sundowner, cooked the way this stretch of the river eats. |
| `dn.story` | The kitchen buys from the morning boat and the market behind the temple, so the specials are decided at the pier, not on paper. |
| `dn.hours` | Open daily · breakfast on the pier 07:00 to 11:00 · kitchen until 22:00 |
| `dn.menuEyebrow` | The menu |
| `dn.menuH2` | What the kitchen sends out |
| **Events & Spaces page** | |
| `ev.h1` | The riverside pavilion |
| `ev.lead` | An open-sided teak pavilion on the water for weddings, long dinners and parties · plus the house calendar of evenings worth planning around. |
| `ev.salonEyebrow` | The function salon |
| `ev.salonH2` | One room, open to the river |
| `ev.salonP` | The pavilion seats 60 for dinner and holds 90 standing, with the pier for arrivals by boat and the garden for drinks before. |
| `ev.cap` | 60 seated · 90 standing |
| `ev.t1` | Weddings |
| `ev.t2` | Private dinners |
| `ev.t3` | Parties |
| `ev.cta` | Plan your event |
| `ev.listEyebrow` | Special events |
| `ev.listH2` | On the house calendar |
| `ev.empty` | Nothing on the calendar right now · ask the desk what is coming. |
| **Home · Beyond the rooms strip** | |
| `beyond.eyebrow` | Beyond the rooms |
| `beyond.h2` | Dinner, evenings and the rest of the house |
| `beyond.p` | The pier kitchen, a riverside pavilion for occasions, and the seven things the house keeps ready. |
| `beyond.dining.p` | Breakfast on the pier, a Thai kitchen and cocktails at sundown. |
| `beyond.events.p` | A teak pavilion on the water for weddings, dinners and parties. |
| `beyond.fac.p` | Pool, garden, lounge and the quiet machinery of a good stay. |

## Concierge offline replies (`lib/conciergeIntents.ts`)

The `th` slot mirrors EN for the new events intent; the dining reply keeps its
certified Thai sentence but the appended link label is English:

| Where | English value |
| --- | --- |
| events intent reply (en+th) | The riverside pavilion hosts weddings, private dinners and parties: 60 seated, 90 standing, arrivals by boat welcome. Our special evenings are on the events page. `<a href="/events">Events & Spaces</a>` |
| dining reply link label (en+th) | See the full menu |
| dining reply new EN sentence | The kitchen cooks until 22:00. |

## DB seed strings (`lib/seedDatabase.ts` · `*Th` columns mirror EN)

Dining categories: `Breakfast on the pier` · `Thai kitchen` · `Drinks & cocktails`.

Dishes (name · description · price):
1. Rice soup with river prawns · Gentle rice soup simmered in prawn stock, river prawns, young ginger and crispy garlic. · ฿220
2. Thai omelette with crab · Folded street-style omelette heavy with crab meat, served over jasmine rice with Sriracha. · ฿260
3. Pier fruit tray · Whatever the morning boat brought: mango, pomelo, rose apple and lime-chilli salt. · ฿180
4. Coconut pancakes · Crisp-edged khanom krok off the brass pan, coconut cream still warm from the griddle. · ฿140
5. Eggs any way, teak-house style · Two eggs from Nakhon Pathom, grilled tomato, pork sausage and toast from the corner bakery. · ฿190
6. Chiang Rai pour-over · Single-origin arabica roasted in Chiang Rai, brewed slow at the pier counter. · ฿120
7. River prawn pad thai · Charred rice noodles folded with tamarind and wrapped in an egg net, one grilled river prawn on top. · ฿320
8. Massaman beef short rib · Five-hour short rib in massaman curry, roasted peanuts and pickled cucumber. · ฿420
9. Grilled river fish in salt crust · Whole tilapia packed in salt and lemongrass, grilled over charcoal, three dips. · ฿380
10. Green curry with grilled chicken · Charcoal chicken thigh in green curry, Thai eggplant and sweet basil, roti on the side. · ฿290
11. Pomelo salad · Yam som-o: pomelo, toasted coconut, dried shrimp and a lime dressing that bites back. · ฿240
12. Stir-fried morning glory · Wok-blistered morning glory with yellow bean, garlic and a whisper of chilli. · ฿160
13. Tom yum goong, house style · Hot-sour broth with river prawns, straw mushrooms and young galangal. · ฿300
14. Mango sticky rice · Nam dok mai mango, coconut sticky rice and salted coconut cream. · ฿180
15. Riverside sundowner · The house cocktail: Thai rum, tamarind, palm sugar and lime, stirred over one big cube. · ฿280
16. Lemongrass pandan cooler · Cold-steeped lemongrass and pandan over crushed ice, barely sweet. · ฿120
17. Chrysanthemum iced tea · Old-market chrysanthemum tea, brewed every morning, honey optional. · ฿100
18. Singha on the pier · Ice-cold bottle with a lime wedge, best at sunset. · ฿130

Events (title · description):
1. Loy Krathong riverside dinner · Float a krathong from our pier, then sit down to a five-course Thai dinner under the full moon. One seating, 28 guests.
2. Sunday jazz brunch · A trio on the pavilion deck, free-flow Thai brunch plates and the slow boats going by. Every Sunday, 11:30 to 15:00.
3. Songkran garden lunch · Songkran the old way: water for blessing, not soaking. A khan tok lunch under the mango tree with the whole house.

## Owner manager UI labels (hardcoded EN · rooms-manager convention)

`Add category` · `Add dish` · `Add event` · `Published` · `Hidden` ·
`Hidden from guests` · `Visibility` · `No dishes yet.` · `No events yet.` ·
form field labels (`Name EN/TH`, `Description EN/TH`, `Price (฿)`,
`Title EN/TH`, `Date`, `Image URL`). The rooms manager hardcodes its form
labels in English the same way, so these follow the house pattern and are
listed here only for completeness.

## Page metadata (EN only, like every other guest layout)

- `/dining` · title "Dining" · description "Breakfast on the river pier, a Thai kitchen and drinks at sundown at The Teak House · a riverside boutique demo by Mikaro Studio."
- `/events` · title "Events & Spaces" · description "A riverside teak pavilion for weddings, private dinners and parties, plus special evenings on the house calendar at The Teak House · a demo by Mikaro Studio."
