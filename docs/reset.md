# v17 · RESET · one thing at a time, finished and visible

Saved verbatim from Mike (2026-10-09). These rules override docs/directive-v17.md and its amendments wherever they conflict.

## OPERATING RULES
1. Stop the fan-out. Keep only the Teak House five-star redesign running. Every other task saves its work on its branch and stops. From now on, never more than 2 agents at once, and no new branches beyond those named below.
2. One deliverable at a time, in the order below. Nothing in the next step starts until Mike has approved the current step's preview.
3. Every working session ends with a message to Mike in exactly this format:
   · Preview link(s) he can open
   · Screenshots at phone (390) and laptop (1366) of every page that changed
   · Mike's checklist in his own words, each line DONE or NOT DONE with one short reason
   · What the next session will do, max 3 lines
   No test counts, rebases, crons or engineering logs unless Mike asks.
4. "Done" means Mike's checklist passes in a real browser on the preview at 390 and 1366, PSI mobile ≥95, zero sideways scroll and zero console errors. Green test suites alone are never "done".
5. Make no product decisions beyond what is written here. If something is truly Mike's call, ask once, in one line, with your recommendation, and keep working on everything else.
6. Never remove effects or animations to gain speed. Make them cheap instead.
7. Real photography only. No AI-generated or AI-retouched images, ever.

## STEP 1 · TEAK HOUSE, FINISHED
Branch: the existing Teak House five-star branch.
Mike's checklist:
a. It looks like a five-star hotel website, not simple or basic, even though it serves 3 to 5 star hotels.
b. Hero date picker: the first click is check-in and the second is check-out, shown in that order. The chosen dates and guests carry into the booking flow, so there is never any re-picking after "Check rates".
c. Booking never makes the guest scroll to find the next button. There is one always-visible dock (right rail on desktop, bottom bar on mobile) with Continue.
d. Every image is 100% relevant to its section.
e. Everything works: every link, every form, booking through to a confirmed demo booking, and every owner panel page.
f. Guest and owner pages load fast, with PSI mobile ≥95.
Deliver the preview link and checklist, then wait for Mike's approval. Deploy to production only on his go.

## STEP 2 · SOLENNE REPAIR (not expansion)
Branch: a repair branch cut from Solenne's production commit. The Collection phase 1 work stays parked on its own branch, untouched.
Mike's checklist:
a. No page scrolls sideways at any width from 320 to 1920. Everything fits the screen.
b. The luxury effects and animations are back and refined, including the cursor ring fix, and cheap on performance.
c. Pages and images load instantly and elegantly: heroes preloaded, no blur, nothing visibly loading.
d. Every image is 100% relevant to its section.
e. Everything works end to end.
f. PSI mobile ≥95.
Deliver the preview link and checklist, then wait for approval. Deploy only on Mike's go.

## STEP 3 · SOLENNE COLLECTION (only after Step 2 is live)
Resume the saved Collection plan from its branch, one phase at a time, each ending with a preview link and Mike's approval:
(1) Multi-property collection with unlimited rooms and villas per house.
(2) Amenities and occasions: conference and wedding venues, water park, kids club, spa, each with its own packages.
(3) Full experience packages, from airport arrival to departure.
(4) "My Trip", where the guest manages and follows the whole journey.

## State at reset (2026-10-09)
- Teak House: the five-star redesign runs on branch v17-a (phase 1 architecture committed there). Production: b709563 (HF-1).
- Solenne: production dd39312. Collection phase 1 parked on branch v17-b. Speed and no-blur work (Milestone A phase 1) is on v17-a, not deployed.
