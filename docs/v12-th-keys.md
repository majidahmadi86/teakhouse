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

---

# v13 · new keys awaiting the same Thai pass

Appended per the v13 directive · one combined Thai pass covers both lists.
Everything below carries its **English** copy in the `th` slot. No Thai was
authored.

## Dictionary keys (`lib/i18n-dict.ts`)

| Key | English value |
| --- | --- |
| **Navigation** | |
| `nav.eventsShort` | Events |
| **Reserve a table · calls to action** | |
| `rsv.cta` | Reserve a table |
| `rsv.stripLead` | Ready to eat with us? |
| **Reserve a table · page** | |
| `rsv.h1` | A table by the river |
| `rsv.lead` | Tell us when and how many. No deposit, no card details · we hold the table and confirm by message. |
| `rsv.window` | Service {w} |
| `rsv.step1` | When |
| `rsv.step2` | How many |
| `rsv.step3` | Who to ask for |
| `rsv.date` | Date |
| `rsv.time` | Time |
| `rsv.party` | Party size |
| `rsv.partyHint` | For more than {n} guests, call the house and we will set the long table. |
| `rsv.person` | 1 person |
| `rsv.people` | {n} people |
| `rsv.name` | Name |
| `rsv.contactKind` | How should we reach you? |
| `rsv.kindPhone` | Phone |
| `rsv.kindLine` | LINE |
| `rsv.contact` | Phone number or LINE id |
| `rsv.notes` | Anything we should know |
| `rsv.notesHint` | Allergies, a birthday, a table near the water |
| `rsv.submit` | Request the table |
| `rsv.noDeposit` | No deposit and no card details are taken. |
| **Reserve a table · validation messages** | |
| `rsv.err.date` | Please choose today or a later date. |
| `rsv.err.time` | That time is outside our service hours. Please pick one from the list. |
| `rsv.err.party` | Please choose a party size from the list. |
| `rsv.err.name` | Please tell us your name. |
| `rsv.err.contact` | Please leave a phone number or LINE id so we can confirm. |
| `rsv.err.closed` | Reservations are closed just now. Please contact the house directly. |
| `rsv.err.failed` | Something went wrong at our end. Please try again, or contact the house. |
| **Reserve a table · confirmation** | |
| `rsv.okEyebrow` | Reserved |
| `rsv.okH1` | Your table is requested |
| `rsv.okLead` | The kitchen has it. Keep this reference for when you arrive. |
| `rsv.refLabel` | Your reference |
| `rsv.okNext` | We will confirm by phone or LINE shortly. If your plans change, tell us and we will move the table. |
| `rsv.backToMenu` | Back to the menu |
| **Reserve a table · switched off** | |
| `rsv.closedH1` | Reservations are closed just now |
| `rsv.closedP` | The kitchen is not taking table bookings online at the moment. Call or message the house and we will find you a seat. |

Note · `rsv.window` renders the service hours as `HH:mm to HH:mm`. The word
"to" is the only translatable part; the numerals are the same in both locales.

## Concierge offline reply (`lib/conciergeIntents.ts`)

| Where | English value |
| --- | --- |
| table intent (en+th) | With pleasure. Tell me a date, a time and how many, and the kitchen will hold a table · no deposit. Service runs 11:30 to 22:00. `<a href="/dining/reserve">Reserve a table here</a>` |

## Owner manager labels (hardcoded EN · rooms-manager convention)

Reservations panel: `Table reservations` · `Taking bookings` · `Switched off` ·
`Service starts` · `Kitchen closes` · `Largest party` · `{n} guests` ·
`The last sitting is one hour before the kitchen closes.` ·
`Upcoming tables` · `{n} to confirm` · `No tables booked yet.` · `Past ({n})` ·
`Hide past` · `guest` / `guests` · statuses `Pending` `Confirmed` `Seated`
`Cancelled` · `Guests can request a table on the dining page · {n} sittings per
day.` · `The reserve-a-table button is hidden across the site while this is
off.`

Upload fields: `Upload image` · `Replace image` · `Uploading` ·
`Remove image` · `Image uploads activate after storage setup.` ·
`Use a jpg, png or webp image.` · `That image is over 8MB even after
resizing.` · `Upload failed. Please try again.` · `Category image` ·
`Dish photo` · `Event image` · `Or paste an image path` ·
`Upload a room photo` · `Dining page hero` · `Events page hero`.

## Page metadata (EN only, like every other guest layout)

- `/dining/reserve` · title "Reserve a table" · description "Reserve a table at The Teak House riverside kitchen · pick a date, a time and a party size, no deposit required. A demo by Mikaro Studio."

## Not translatable

The guest-facing reference code (`TBL-XXXX`) is deliberately alphanumeric in
both locales · it gets read aloud down a phone line.

---

# v14 · new keys awaiting the same Thai pass

Appended per the v14 directive. Everything below carries its **English** copy
in the `th` slot. No Thai was authored.

## Dictionary keys (`lib/i18n-dict.ts`)

| Key | English value |
| --- | --- |
| **Desktop reservation card** | |
| `rsv.cardEyebrow` | The kitchen |
| `rsv.cardH` | Keep a table for you |
| `rsv.cardP` | Pick a time and we will have it laid when you arrive. |
| **Event seat requests** | |
| `evr.cta` | Reserve seats |
| `evr.h1` | Seats at the table |
| `evr.lead` | Tell us which evening and how many of you. No payment · the house confirms by phone or LINE. |
| `evr.step1` | Which evening |
| `evr.event` | Event |
| `evr.guests` | Guests |
| `evr.notesHint` | Allergies, a celebration, anything we should plan for |
| `evr.submit` | Request seats |
| `evr.noPayment` | No payment is taken. Seats are held once we confirm. |
| `evr.okEyebrow` | Requested |
| `evr.okH1` | Your seats are requested |
| `evr.okLead` | The house has it. Keep this reference for when you arrive. |
| `evr.okNext` | We will confirm by phone or LINE shortly. Evenings with limited seating fill quickly, so we will tell you either way. |
| `evr.backToEvents` | Back to the events |
| `evr.err.event` | That evening is no longer open. Please choose another from the list. |
| `evr.err.name` | Please tell us your name. |
| `evr.err.contact` | Please leave a phone number or LINE id so we can confirm. |
| `evr.err.guests` | Please choose how many seats you need. |
| `evr.err.failed` | Something went wrong at our end. Please try again, or contact the house. |
| **Adaptive contact form** | |
| `ct.about` | What is this about? |
| `ct.aboutStay` | A stay |
| `ct.aboutDining` | Dining |
| `ct.aboutEvent` | An event |
| `ct.aboutOther` | Something else |
| `ct.contactField` | Email, phone or LINE id |
| `ct.dates` | Dates |
| `ct.checkIn` | Check in |
| `ct.checkOut` | Check out |
| `ct.when` | When and how many |
| `ct.party` | Guests |
| `ct.sentH` | Thank you · it is with us |
| `ct.sentP` | The house reads messages through the day and answers on the same channel you left. |
| `ct.sendAnother` | Send another |
| `ct.err.name` | Please tell us your name. |
| `ct.err.contact` | Please leave an email, phone number or LINE id so we can reply. |
| `ct.err.message` | Please write a short message. |
| `ct.err.failed` | Something went wrong at our end. Please try again, or call the house. |
| **Mobile drawer group** | |
| `nav.exploreGroup` | Experience |
| **Owner** | |
| `ow.messages` | Messages |

Note · `ct.name`, `ct.message` and `ct.send` already carry real Thai from v7
and were reused unchanged.

## Concierge offline reply (`lib/conciergeIntents.ts`)

The events reply gained one sentence (en+th both English for now):
"You can also reserve seats at one of our special evenings · no payment, we
confirm by phone or LINE."

## Owner labels (hardcoded EN · rooms-manager convention)

Seat requests panel: `Seat requests` · `{n} to answer` · `{n} seats confirmed` ·
`No seat requests yet.` · `seat` / `seats` · statuses `Pending` `Confirmed`
`Declined`.
Messages: `All` · `A stay` · `Dining` · `An event` · `Something else` ·
`{n} new` · `Nothing here yet.` · statuses `New` `Read` `Done`.

## Page metadata (EN only, like every other guest layout)

- `/events/reserve` · title "Reserve seats" · description "Request seats at a special evening on the house calendar at The Teak House · no payment, the house confirms. A demo by Mikaro Studio."

---

# Thai install · status after the Claude-authored pass

The Thai block covering v12 and v13 keys is INSTALLED (72 dictionary keys, 3
concierge replies, 3 dining categories, 18 dishes, 3 events). Verified with
`node scripts/th-leakage.js`, which loads every guest route with tkh-lang=th
and reports visible English, allowing brand names and proper nouns.

Clean in Thai: `/dining/reserve` · `/book` · `/location` · `/gallery`.

## Complete · nothing is English any more

The Thai dictionary is FULLY INSTALLED. The 111 lines this document used to
list as debt (19 v14 keys and roughly 92 from v11) are authored and shipped,
along with the v14 concierge events sentence and about 80 owner-panel labels
that had never been in the dictionary at all.

Two gates keep it that way:

`node scripts/th-missing.js` reads the dictionary itself and lists any key
whose Thai slot is not Thai. It reports **0 keys need Thai**. It allows the
Latin that is correct inside a Thai value · brands, route paths, file
extensions, `EMAIL_PROVIDER`, `webhook`, and the `{placeholder}` names, which
are code rather than copy.

`node scripts/th-leakage.js` loads every rendered surface in Thai and reports
visible English. **0 English lines across all 13 guest routes**, and 0 across
the 9 owner routes once the demo data is the seeded set. Run the owner pass
with `OWNER=1`.

`node scripts/th-overflow.js` checks that no Thai string clips or wraps out of
its box at 360, 390, 1093 and 1366 · **156/156**.

### Terms chosen where Thai offered options

| English | Chosen | Why |
| --- | --- | --- |
| reserve seats (an event) | จองที่นั่ง | keeps "seat" literal, so it reads differently from จองโต๊ะ (book a table) |
| guests (a count) | ท่าน | the polite counter for people; คน is neutral but flat for a hotel |
| multiplier | ตัวคูณ | the arithmetic word an owner reads on a rate row |
| date override | ราคาเชพาะวัน | "price for specific days", clearer than a loanword |
| base rate | ราคาพื้นฐาน | pairs with the season and override rows above it |
| season | ช่วงฑูกาล | a date range, not the weather |
| fixed price | ราคาคงที่ | the opposite of a multiplier, in the same register |
| ADR | ADR | the hotel-industry acronym; Thai revenue managers use it untranslated |

Politeness follows register: ค่ะ appears only in conversational replies (the
concierge), never on labels, buttons or table headers.

### Known and deliberate

Around 50 `alt=""` texts and the per-route `metadata.title` / `description`
are still English. Neither is measured by these audits, because neither is
visible copy · they are read by screen readers and search engines. Worth a
pass, listed here so it is not mistaken for an oversight.

`SeasonalPriceRule.label` is one non-localized column by design: it holds
whatever the owner typed, so the seeded demo rows read "High season" and
"Weekend premium" in both languages.


## Not translated on purpose

Room names (River Loft, Teak Suite and the rest) are the property's own names,
the reference codes TBL-XXXX and EVT-XXXX are alphanumeric so they can be read
down a phone line, and `stay@teakhouse.demo` is an address. Years stay
Gregorian: the rates, policies and booking engine all quote Gregorian years,
so Buddhist-era years would be a content decision rather than a formatting one.
