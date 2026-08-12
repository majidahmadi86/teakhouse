# v11 · new dictionary keys awaiting a Thai pass

Every key below currently carries its **English** copy in the `th` slot.
Nothing here was authored in Thai. Existing Thai strings were reused wherever
the meaning was identical, so they do not appear in this list:

- `drp.done` · the date picker's sticky Apply button on mobile
- `bk.night` / `bk.nights` · the night unit in rate breakdowns and concierge replies
- `avail.in` / `avail.out` / `avail.selectDates` · date field labels
- `ow.save` / `ow.del` / `ow.sure` / `col.room` · owner rate calendar controls
- the booking-page Thai reply reused verbatim by the offline concierge matcher

Two `date.*` groups are **not** display copy: they are the pipe-separated
spellings the concierge accepts when reading dates out of a guest message.
Adding Thai spellings there turns Thai date parsing on with no code change.

| Key | English value |
| --- | --- |
| **Navigation** | |
| `nav.facilities` | Facilities |
| **Facilities page + home strip** | |
| `fac.h1` | What the house keeps for you |
| `fac.lead` | Seven things we look after, so that none of them is your problem while you are here. |
| `fac.pool.h` | The courtyard pool |
| `fac.pool.p` | Saltwater, shaded by the old mango tree, open 07:00 to 21:00. |
| `fac.pool.p2` | Towels are in the pool house and no one has ever needed to reserve a chair. |
| `fac.pier.h` | Breakfast on the river pier |
| `fac.pier.p` | Laid on the pier from 07:00 to 11:00, while the first ferries cross. |
| `fac.pier.p2` | Rice soup, fruit cut that morning, eggs to order, coffee roasted in Chiang Rai. |
| `fac.garden.h` | The courtyard garden |
| `fac.garden.p` | A walled garden of frangipani and ferns, cool enough to sit in at midday. |
| `fac.garden.p2` | It is where guests sit down with a book and lose the afternoon. |
| `fac.lounge.h` | The lobby lounge |
| `fac.lounge.p` | The old front room, kept as it was: teak floors, deep chairs, quiet fans. |
| `fac.lounge.p2` | Tea all day, a small bar from six, and someone at the desk around the clock. |
| `fac.transfer.h` | Airport transfer |
| `fac.transfer.p` | A private car to either airport at any hour, arranged when you book. |
| `fac.transfer.p2` | The driver waits inside the terminal with your name on a teak board. |
| `fac.housekeeping.h` | Daily housekeeping |
| `fac.housekeeping.p` | Rooms made up each morning and turned down again in the evening. |
| `fac.housekeeping.p2` | Linen is changed when you ask for it rather than on a fixed schedule. |
| `fac.luggage.h` | Luggage storage |
| `fac.luggage.p` | Arrive before check-in or leave long after check-out, either is fine. |
| `fac.luggage.p2` | Bags stay locked behind the desk, tagged, for as long as you need them to. |
| `fac.strip.eyebrow` | Facilities |
| `fac.strip.h2` | The house looks after the rest |
| `fac.strip.p` | A pool in the courtyard, breakfast on the pier, a car to the airport, and your bags kept safe either side of your stay. |
| `fac.strip.cta` | See all facilities |
| **House & team** | |
| `house.eyebrow` | House & team |
| `house.h1` | The house and the people in it |
| `house.h2` | Built in 1926. Still standing, still full. |
| `house.p1` | A teak trading house on Charoenkrung 44, put up in 1926 when the river was the road and this quarter shipped hardwood downstream. Twelve rooms, one staircase, and floorboards that announce every guest who comes home late. |
| `house.p2` | It sat empty for most of the nineties. The restoration kept what was worth keeping: the shutters, the teak, the pier, the mango tree in the courtyard. Everything else was rebuilt around them. |
| `house.p3` | We run it with a small team and no front-of-house theatre. Book direct and the money stays in the building, which is how the roof gets fixed. |
| `house.teamH` | Who you will meet |
| `house.teamP` | Four people keep the house running. You will know all of them by the second morning. |
| `house.r1n` | Khun Nok |
| `house.r1r` | General manager |
| `house.r1p` | Runs the house and knows every creak in the floor. If something is wrong, say so before you leave. |
| `house.r2n` | Khun Nam |
| `house.r2r` | Concierge |
| `house.r2p` | Books the boats, the tables, and the car to the airport. Also answers the chat on this site, day and night. |
| `house.r3n` | Khun Toy |
| `house.r3r` | Housekeeping lead |
| `house.r3p` | Twelve rooms, turned twice a day. Flags a tired mattress long before a guest would notice it. |
| `house.r4n` | Khun Chai |
| `house.r4r` | Breakfast cook |
| `house.r4p` | On the pier from six, cutting fruit. The rice soup is why people come down early. |
| `house.demoNote` | Demo property · team members are illustrative roles, not real individuals. |
| **Concierge · availability answers** | |
| `cg.av.head` | {in} to {out} · {n} {unit}. |
| `cg.av.free` | Free for those dates: |
| `cg.av.room` | {room} at {nightly} a night, {total} total |
| `cg.av.nightlyRange` | {lo} to {hi} |
| `cg.av.mixed` | Rates differ by date across your stay. |
| `cg.av.none` | Nothing is free for those dates. |
| `cg.av.alt` | The nearest free nights are {in} to {out}, from {total}. |
| `cg.av.noAlt` | Nothing close is free either · tell me other dates and I will look again. |
| `cg.av.book` | Book these dates |
| `cg.av.checking` | Let me check the book and come back to you. |
| **Concierge · date parser vocabulary (PARSER INPUT, not UI copy)** | |
| `date.mon.jan` | jan|january |
| `date.mon.feb` | feb|february |
| `date.mon.mar` | mar|march |
| `date.mon.apr` | apr|april |
| `date.mon.may` | may |
| `date.mon.jun` | jun|june |
| `date.mon.jul` | jul|july |
| `date.mon.aug` | aug|august |
| `date.mon.sep` | sep|sept|september |
| `date.mon.oct` | oct|october |
| `date.mon.nov` | nov|november |
| `date.mon.dec` | dec|december |
| `date.weekend` | this weekend|the weekend|weekend |
| `date.nextWeekend` | next weekend |
| `date.tonight` | tonight|today |
| `date.tomorrow` | tomorrow |
| `date.nextWeek` | next week |
| `date.nights` | night|nights |
| **Booking · per-night pricing** | |
| `bk.stayTotal` | Stay total |
| `bk.perNight` | Price per night |
| `bk.mixedNote` | Nightly rates differ across your stay · the total is the sum of each night. |
| **Owner · rate calendar** | |
| `ow.rateCalendar` | Rate calendar |
| `ow.rateLead` | What each night costs · a date override beats a season, a season beats the base rate. |
| `ow.ruleCount` | {n} rate rules |
| `ow.baseOnly` | Base rate only |
| `ow.rateBase` | Base rate |
| `ow.rateBaseInvalid` | Enter a base rate above zero |
| `ow.rateBaseSaved` | Base rate saved |
| `ow.rateFlat` | Every night this month is {p} |
| `ow.rateSpread` | {lo} to {hi} this month |
| `ow.rateLegendBase` | Base rate |
| `ow.rateLegendSeason` | Season |
| `ow.rateLegendOverride` | Date override |
| `ow.rateGridHint` | Tap any date to start a one-day override for it. |
| `ow.rateRules` | Rules for this room |
| `ow.rateNoRules` | No rules yet · every night is the base rate. |
| `ow.rateAdd` | Add a rule |
| `ow.rateKind` | Rule type |
| `ow.rateSeason` | Season |
| `ow.rateOverride` | Date override |
| `ow.rateUnnamed` | Unnamed |
| `ow.rateLabel` | Label |
| `ow.rateMode` | Price mode |
| `ow.rateFixed` | Fixed price |
| `ow.rateMultiplier` | Multiplier |
| `ow.rateFixedLabel` | Price per night (THB) |
| `ow.rateMultiplierLabel` | Multiply the base rate by |
| `ow.rateAddBtn` | Add rule |
| `ow.rateSaved` | Rule added |
| `ow.rateSaveFailed` | Could not save the rule |
| `ow.rateDeleted` | Rule deleted |
| `ow.rateDatesRequired` | Start and end dates are required |
| `ow.rateEndBeforeStart` | End date must not be before the start date |
| `ow.rateAmountRequired` | Enter a price or multiplier above zero |

**Total: 113 new keys.**
