# Image ledger

The curated photography the registry serves (scripts/images/images.config.mjs,
built by scripts/images/build-images.mjs into public/img and
lib/images.generated.ts). One row per registered image id. Masters live in
tools/image-masters/ (gitignored, never committed).

- Brightness is the true greyscale mean of the master (0 to 255).
- Tone is the ground colour the slot shows until the image has decoded.
- Photo page is the source page the frame was taken from (Unsplash or Pexels).
- Ids ending in `-m` are the 4:5 phone crops of a page hero, at the hero's focal point.

## Registered

| Id | Page · section | Photo page | Author | Source | Licence | Master | Brightness | Tone |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hero-home | / · Hero (LCP) | [pexels 7546599](https://www.pexels.com/photo/cozy-resting-place-with-water-view-7546599/) | [Max Vakhtbovych](https://www.pexels.com/@artbovich/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2803 | 130.6 | `#9c9a98` |
| hero-home-m | / · Hero (LCP), phone crop 4:5 | [pexels 7546599](https://www.pexels.com/photo/cozy-resting-place-with-water-view-7546599/) | [Max Vakhtbovych](https://www.pexels.com/@artbovich/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2803 | 130.6 | `#9c9a98` |
| hero-rooms | /rooms · Page hero | [unsplash cty6Z4-hzVk](https://unsplash.com/photos/cty6Z4-hzVk) | [Lisa Anna](https://unsplash.com/@lisaanna195) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 174.2 | `#c1beb4` |
| hero-rooms-m | /rooms · Page hero, phone crop 4:5 | [unsplash cty6Z4-hzVk](https://unsplash.com/photos/cty6Z4-hzVk) | [Lisa Anna](https://unsplash.com/@lisaanna195) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 174.2 | `#c1beb4` |
| hero-dining | /dining · Page hero | [unsplash pHdrin7H4D8](https://unsplash.com/photos/pHdrin7H4D8) | [Abdul Raheem Kannath](https://unsplash.com/@raheemblacksnows) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2722 | 139.3 | `#af9f8e` |
| hero-dining-m | /dining · Page hero, phone crop 4:5 | [unsplash pHdrin7H4D8](https://unsplash.com/photos/pHdrin7H4D8) | [Abdul Raheem Kannath](https://unsplash.com/@raheemblacksnows) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2722 | 139.3 | `#af9f8e` |
| hero-dining-reserve | /dining/reserve · Page hero | [unsplash f6QoaTtdyGw](https://unsplash.com/photos/f6QoaTtdyGw) | [Guillaume de Germain](https://unsplash.com/@guillaumedegermain) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4000x2667 | 166.4 | `#bbb7b3` |
| hero-dining-reserve-m | /dining/reserve · Page hero, phone crop 4:5 | [unsplash f6QoaTtdyGw](https://unsplash.com/photos/f6QoaTtdyGw) | [Guillaume de Germain](https://unsplash.com/@guillaumedegermain) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4000x2667 | 166.4 | `#bbb7b3` |
| hero-events | /events · Page hero | [unsplash 8eDuPKLpFQE](https://unsplash.com/photos/8eDuPKLpFQE) | [Rhamely](https://unsplash.com/@rhamely) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 134.5 | `#9f9f94` |
| hero-events-m | /events · Page hero, phone crop 4:5 | [unsplash 8eDuPKLpFQE](https://unsplash.com/photos/8eDuPKLpFQE) | [Rhamely](https://unsplash.com/@rhamely) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 134.5 | `#9f9f94` |
| hero-events-reserve | /events/reserve · Page hero | [pexels 15613459](https://www.pexels.com/photo/flowers-decoration-over-wedding-table-15613459/) | [Thomas Beaman](https://www.pexels.com/@thomas-beaman-460315958/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2800 | 158.8 | `#b4b2ac` |
| hero-events-reserve-m | /events/reserve · Page hero, phone crop 4:5 | [pexels 15613459](https://www.pexels.com/photo/flowers-decoration-over-wedding-table-15613459/) | [Thomas Beaman](https://www.pexels.com/@thomas-beaman-460315958/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2800 | 158.8 | `#b4b2ac` |
| hero-gallery | /gallery · Page hero | [unsplash YUkmX9xJaa4](https://unsplash.com/photos/YUkmX9xJaa4) | [Tamara B](https://unsplash.com/@flawedlogic) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 144.9 | `#aca796` |
| hero-gallery-m | /gallery · Page hero, phone crop 4:5 | [unsplash YUkmX9xJaa4](https://unsplash.com/photos/YUkmX9xJaa4) | [Tamara B](https://unsplash.com/@flawedlogic) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 144.9 | `#aca796` |
| hero-contact | /contact · Page hero | [unsplash cTuwMgIW3Cc](https://unsplash.com/photos/cTuwMgIW3Cc) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 127.8 | `#9b998d` |
| hero-contact-m | /contact · Page hero, phone crop 4:5 | [unsplash cTuwMgIW3Cc](https://unsplash.com/photos/cTuwMgIW3Cc) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 127.8 | `#9b998d` |
| hero-account | /account/signin, /account/signup · Auth panel (portrait, 45vw by full height), portrait crop 3:4 | [unsplash 0LKYWJ12ugI](https://unsplash.com/photos/0LKYWJ12ugI) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x6299 | 145.3 | `#a4a997` |
| room-deluxe-king | /rooms/deluxe-king, /rooms, /, /book, header mega menu · Deluxe King: cover (bedroom) | [unsplash yOs9Zc5JvTw](https://unsplash.com/photos/yOs9Zc5JvTw) | [Clay Banks](https://unsplash.com/@claybanks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 3400x2267 | 149.7 | `#bba890` |
| room-deluxe-twin | /rooms/deluxe-twin, /rooms, /, /book, header mega menu · Deluxe Twin: cover (bedroom) | [unsplash pe1xVjJJlE4](https://unsplash.com/photos/pe1xVjJJlE4) | [Tran Vinh](https://unsplash.com/@vinhtran21) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4000x2667 | 141 | `#aba294` |
| room-premier-river | /rooms/premier-river, /rooms, /, /book, header mega menu · Premier River View: cover (bedroom) | [unsplash vvYs67H9Y2E](https://unsplash.com/photos/vvYs67H9Y2E) | [Greg Rivers](https://unsplash.com/@rivphoto) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 176.8 | `#c8bfb0` |
| room-junior-suite | /rooms/junior-suite, /rooms, /, /book, header mega menu · Junior Suite: cover (bedroom) | [pexels 7031736](https://www.pexels.com/photo/bed-near-window-in-bedroom-7031736/) | [Max Vakhtbovych](https://www.pexels.com/@artbovich/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2803 | 166.6 | `#c7b4a6` |
| room-teak-suite | /rooms/teak-suite, /rooms, /, /book, header mega menu · Teak Suite: cover (bedroom) | [unsplash o9AZb_u6d9w](https://unsplash.com/photos/o9AZb_u6d9w) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 120.3 | `#9c917e` |
| room-royal-teak-suite | /rooms/royal-teak-suite, /rooms, /, /book, header mega menu · Royal Teak Suite: cover (bedroom) | [unsplash mOMk_bTLDwo](https://unsplash.com/photos/mOMk_bTLDwo) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 134.2 | `#9e9e9b` |
| room-deluxe-king-bath | /rooms/deluxe-king, /book room modal · Deluxe King: bathroom | [pexels 8089171](https://www.pexels.com/photo/an-interior-of-a-bathroom-8089171/) | [Max Vakhtbovych](https://www.pexels.com/@artbovich/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2721 | 168.8 | `#c1baa6` |
| room-deluxe-king-view | /rooms/deluxe-king, /book room modal · Deluxe King: view, terrace or window | [unsplash l1ONpGNOZeE](https://unsplash.com/photos/l1ONpGNOZeE) | [Franco Debartolo](https://unsplash.com/@francotheshooter) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 128.5 | `#9b9a91` |
| room-deluxe-king-detail | /rooms/deluxe-king, /book room modal · Deluxe King: detail | [pexels 545046](https://www.pexels.com/photo/bed-bedroom-comfort-contemporary-545046/) | [Burst](https://www.pexels.com/@burst/) | pexels | Pexels License (uploaded as CC0, free to use, checked 2026-10-08) | 4200x2801 | 191.4 | `#d8c9ba` |
| room-deluxe-twin-bath | /rooms/deluxe-twin, /book room modal · Deluxe Twin: bathroom | [unsplash Ga1X7wKiajs](https://unsplash.com/photos/Ga1X7wKiajs) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x5250 | 178.8 | `#c6c1b8` |
| room-deluxe-twin-view | /rooms/deluxe-twin, /book room modal · Deluxe Twin: view, terrace or window | [unsplash 5LXM3u4HESo](https://unsplash.com/photos/5LXM3u4HESo) | [Tran Vinh](https://unsplash.com/@vinhtran21) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4000x2667 | 144.1 | `#a9a69a` |
| room-deluxe-twin-detail | /rooms/deluxe-twin, /book room modal · Deluxe Twin: detail | [unsplash BNHriM9hio4](https://unsplash.com/photos/BNHriM9hio4) | [Najib Kalil](https://unsplash.com/@nkalil) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 3667x5500 | 133.4 | `#a09d94` |
| room-premier-river-bath | /rooms/premier-river, /book room modal · Premier River View: bathroom | [unsplash uqNmKbEzYcE](https://unsplash.com/photos/uqNmKbEzYcE) | [Franco Debartolo](https://unsplash.com/@francotheshooter) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 177.2 | `#c0c1ba` |
| room-junior-suite-bath | /rooms/junior-suite, /book room modal · Junior Suite: bathroom | [unsplash p9A8tpM93Hk](https://unsplash.com/photos/p9A8tpM93Hk) | [GoodLifeConstruction](https://unsplash.com/@goodlifeconstruction) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 159.1 | `#bbb0a7` |
| room-junior-suite-view | /rooms/junior-suite, /book room modal · Junior Suite: view, terrace or window | [pexels 7546605](https://www.pexels.com/photo/lounge-chairs-on-a-wooden-deck-and-a-swimming-pool-7546605/) | [Max Vakhtbovych](https://www.pexels.com/@artbovich/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2803 | 159.4 | `#a8b4b8` |
| room-junior-suite-detail | /rooms/junior-suite, /book room modal · Junior Suite: detail | [pexels 7031732](https://www.pexels.com/photo/interior-of-living-room-with-couch-and-big-windows-7031732/) | [Max Vakhtbovych](https://www.pexels.com/@artbovich/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2803 | 160.6 | `#c0b0a1` |
| room-teak-suite-bath | /rooms/teak-suite, /book room modal · Teak Suite: bathroom | [unsplash w8FEsHwwL10](https://unsplash.com/photos/w8FEsHwwL10) | [Vije Vijendranath](https://unsplash.com/@vijev) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 126.8 | `#99998f` |
| room-teak-suite-view | /rooms/teak-suite, /book room modal · Teak Suite: view, terrace or window | [unsplash LeF-gvkTuHI](https://unsplash.com/photos/LeF-gvkTuHI) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 128.5 | `#969c83` |
| room-teak-suite-detail | /rooms/teak-suite, /book room modal · Teak Suite: detail | [pexels 39836711](https://www.pexels.com/photo/elegant-wooden-chair-in-sunlit-room-39836711/) | [Keegan Checks](https://www.pexels.com/@keeganjchecks/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2800 | 163.3 | `#bfb3a9` |
| room-royal-teak-suite-bath | /rooms/royal-teak-suite, /book room modal · Royal Teak Suite: bathroom | [unsplash HWUfaQt6aLU](https://unsplash.com/photos/HWUfaQt6aLU) | [Franco Debartolo](https://unsplash.com/@francotheshooter) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 169 | `#b9bbb8` |
| room-royal-teak-suite-view | /rooms/royal-teak-suite, /book room modal · Royal Teak Suite: view, terrace or window | [unsplash ksa5r_xt8cg](https://unsplash.com/photos/ksa5r_xt8cg) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 125.9 | `#909b80` |
| room-royal-teak-suite-detail | /rooms/royal-teak-suite, /book room modal · Royal Teak Suite: detail | [unsplash WYu1zm9gFgk](https://unsplash.com/photos/WYu1zm9gFgk) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x6300 | 143 | `#aba590` |
| dish-rice-soup | /dining · Dish thumbnail (Breakfast on the pier), square crop 1:1 | [unsplash duPZXKQHbQ8](https://unsplash.com/photos/duPZXKQHbQ8) | [Dean Zhang](https://unsplash.com/@startdig) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x6300 | 135.6 | `#a69e90` |
| dish-crab-omelette | /dining · Dish thumbnail (Breakfast on the pier), square crop 1:1 | [unsplash oqzVlrjVeAI](https://unsplash.com/photos/oqzVlrjVeAI) | [Markus Winkler](https://unsplash.com/@markuswinkler) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 2999x3999 | 162.2 | `#c4b09a` |
| dish-fruit-tray | /dining · Dish thumbnail (Breakfast on the pier), square crop 1:1 | [unsplash dpsWlhSrIs0](https://unsplash.com/photos/dpsWlhSrIs0) | [Lauriane Sevestre](https://unsplash.com/@lausvtre) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 3024x3024 | 152 | `#bca991` |
| dish-eggs | /dining · Dish thumbnail (Breakfast on the pier), square crop 1:1 | [unsplash IjnAfgpG_4g](https://unsplash.com/photos/IjnAfgpG_4g) | [Rimsha Noor](https://unsplash.com/@rimshaj123) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x4200 | 158.7 | `#b8b1a1` |
| dish-coffee | /dining · Dish thumbnail (Breakfast on the pier), square crop 1:1 | [pexels 7623618](https://www.pexels.com/photo/pouring-hot-water-on-coffee-ground-in-a-filter-7623618/) | [Miriam Alonso](https://www.pexels.com/@miriam-alonso/) | pexels | Pexels License (free to use, checked 2026-10-08) | 2800x4200 | 188.5 | `#d0c9c0` |
| dish-pad-thai | /dining · Dish thumbnail (Thai kitchen), square crop 1:1 | [unsplash byTYXNHeVoU](https://unsplash.com/photos/byTYXNHeVoU) | [Alyssa Kowalski](https://unsplash.com/@lockandkey) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 184.6 | `#d5c2ad` |
| dish-massaman | /dining · Dish thumbnail (Thai kitchen), square crop 1:1 | [unsplash 4ZyLEI4y3-0](https://unsplash.com/photos/4ZyLEI4y3-0) | [Zoshua Colah](https://unsplash.com/@zoshuacolah) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 3708x2986 | 151.3 | `#b6a993` |
| dish-grilled-fish | /dining · Dish thumbnail (Thai kitchen), square crop 1:1 | [unsplash g8CdCjiVJ44](https://unsplash.com/photos/g8CdCjiVJ44) | [Husien Bisky](https://unsplash.com/@husien_bisky1) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 3840x2882 | 230.3 | `#ecebe8` |
| dish-green-curry | /dining · Dish thumbnail (Thai kitchen), square crop 1:1 | [unsplash LFbkWC3n2QQ](https://unsplash.com/photos/LFbkWC3n2QQ) | [B R A Y D E N](https://unsplash.com/@brayhavior) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2794 | 142.5 | `#a6a493` |
| dish-pomelo-salad | /dining · Dish thumbnail (Thai kitchen), square crop 1:1 | [unsplash Ez5jlU-BemI](https://unsplash.com/photos/Ez5jlU-BemI) | [Max Griss](https://unsplash.com/@grissphoto) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 3064x3830 | 155.2 | `#b6adab` |
| dish-morning-glory | /dining · Dish thumbnail (Thai kitchen), square crop 1:1 | [unsplash 0dIp5xbSJ8U](https://unsplash.com/photos/0dIp5xbSJ8U) | [R Eris](https://unsplash.com/@eprayatama) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4000x5000 | 138.5 | `#a6a094` |
| dish-tom-yum | /dining · Dish thumbnail (Thai kitchen), square crop 1:1 | [unsplash XVhLLmMR6jg](https://unsplash.com/photos/XVhLLmMR6jg) | [Hazim Abd Halim](https://unsplash.com/@hazim_abdhalim) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2804 | 211.6 | `#d9ddd7` |
| dish-mango-sticky-rice | /dining · Dish thumbnail (Thai kitchen), square crop 1:1 | [unsplash joy1qAjz05A](https://unsplash.com/photos/joy1qAjz05A) | [Michala Li](https://unsplash.com/@michalali) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 138.2 | `#a5a192` |
| dish-sundowner | /dining · Dish thumbnail (Drinks and cocktails), square crop 1:1 | [unsplash wrkyya-alS8](https://unsplash.com/photos/wrkyya-alS8) | [Allan Francis](https://unsplash.com/@allanbenjaminfrancis) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 3000x3000 | 169.4 | `#cbb695` |
| dish-lemongrass-cooler | /dining · Dish thumbnail (Drinks and cocktails), square crop 1:1 | [unsplash U4mCZiti-aM](https://unsplash.com/photos/U4mCZiti-aM) | [Rajasekhar R](https://unsplash.com/@rajasekhar21) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 143 | `#9ba99a` |
| dish-iced-tea | /dining · Dish thumbnail (Drinks and cocktails), square crop 1:1 | [pexels 8365612](https://www.pexels.com/photo/iced-tea-and-sugar-8365612/) | [Jason Deines](https://www.pexels.com/@jason-deines-2993297/) | pexels | Pexels License (free to use, checked 2026-10-08) | 2803x4199 | 217.6 | `#e3e0dd` |
| dish-beer | /dining · Dish thumbnail (Drinks and cocktails), square crop 1:1 | [pexels 969944](https://www.pexels.com/photo/clear-short-stem-wine-glass-on-parquet-flooring-969944/) | [Magda Ehlers](https://www.pexels.com/@magda-ehlers-pexels/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2800 | 171.5 | `#d0b89a` |
| exp-house | /experience · House and team: house portrait (4:5) | [pexels 15994062](https://www.pexels.com/photo/luxury-apartment-with-swimming-pool-15994062/) | [Anastasiia Nikulinskikh](https://www.pexels.com/@anastasiia-nikulinskikh-493466564/) | pexels | Pexels License (free to use, checked 2026-10-08) | 3024x4032 | 149.5 | `#9aaea7` |
| exp-about-house | / · About the house (4:5 desktop, 5:4 mobile) | [unsplash lJ8KZfLCYQs](https://unsplash.com/photos/lJ8KZfLCYQs) | [Tamara B](https://unsplash.com/@flawedlogic) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 117.8 | `#94927f` |
| exp-pool | /experience · Story 2: the courtyard pool | [unsplash MiWGoGARyDQ](https://unsplash.com/photos/MiWGoGARyDQ) | [karl muscat](https://unsplash.com/@kmus07) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4000x5000 | 171.9 | `#bcbdb2` |
| exp-massage | /experience · Story 3: Thai massage upstairs | [unsplash -AakIaAPV0w](https://unsplash.com/photos/-AakIaAPV0w) | [Simon HUMLER](https://unsplash.com/@simonhumlr) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 3648x5472 | 172.9 | `#d3b8a2` |
| exp-breakfast | /experience · Story 1: breakfast on the pier | [unsplash OI4yEn4O-rY](https://unsplash.com/photos/OI4yEn4O-rY) | [Iason Raissis](https://unsplash.com/@jay_raissis) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 196 | `#cfcfd0` |
| exp-team-housekeeping | /experience · House and team: housekeeping lead (square) | [unsplash zWvy2pp-lUw](https://unsplash.com/photos/zWvy2pp-lUw) | [engin akyurt](https://unsplash.com/@enginakyurt) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 153.4 | `#aeaead` |
| exp-team-concierge | /experience · House and team: concierge (square) | [pexels 12614037](https://www.pexels.com/photo/close-up-photo-of-a-bell-near-forks-12614037/) | [Rene Terp](https://www.pexels.com/@reneterp/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2800 | 175.3 | `#c3bebb` |
| exp-team-kitchen | /experience · House and team: breakfast cook (square) | [unsplash jddq6Z2BO-Y](https://unsplash.com/photos/jddq6Z2BO-Y) | [iBecome Communication](https://unsplash.com/@ibecomecommunication) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 131.5 | `#a4999b` |
| fac-lounge | /facilities and / (facilities strip) · Facility: the lobby lounge | [unsplash NtmheMV9n_Q](https://unsplash.com/photos/NtmheMV9n_Q) | [Tamara B](https://unsplash.com/@flawedlogic) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 126.5 | `#9a9987` |
| fac-pool | /facilities and / (facilities strip) · Facility: the courtyard pool | [unsplash Wssk_8omX8A](https://unsplash.com/photos/Wssk_8omX8A) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x6300 | 127.8 | `#939b8e` |
| fac-garden | /facilities and / (facilities strip) · Facility: the courtyard garden | [unsplash mgoawDdeAXA](https://unsplash.com/photos/mgoawDdeAXA) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x6300 | 150.2 | `#a5ad9f` |
| fac-housekeeping | /facilities and / (facilities strip) · Facility: daily housekeeping | [unsplash 04ZMu2-vusI](https://unsplash.com/photos/04ZMu2-vusI) | [Dan Burton](https://unsplash.com/@dan__burton) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 132.9 | `#989ea1` |
| fac-transfer | /facilities and / (facilities strip) · Facility: airport transfer | [pexels 4223831](https://www.pexels.com/photo/seats-in-a-car-4223831/) | [Mike Bird](https://www.pexels.com/@mikebird/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2796 | 116.7 | `#8d9196` |
| gallery-palm-shadows | /gallery · Gallery tile (house) | [unsplash ZKEDY8eC1qU](https://unsplash.com/photos/ZKEDY8eC1qU) | [Mavi Atlas](https://unsplash.com/@maviatlas) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4128x5827 | 185.1 | `#d0c6b6` |
| gallery-orchid-console | /gallery · Gallery tile (house) | [unsplash Lxc6mQZEy7M](https://unsplash.com/photos/Lxc6mQZEy7M) | [Trac Vu](https://unsplash.com/@tracminhvu) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4024x6048 | 149.5 | `#aaaba6` |
| gallery-teak-corridor | /gallery · Gallery tile (rooms) | [unsplash WE0F85dLoME](https://unsplash.com/photos/WE0F85dLoME) | [Tamara B](https://unsplash.com/@flawedlogic) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 134.5 | `#a29e91` |
| gallery-pool-cabana | /gallery · Gallery tile (pool) | [unsplash hVbbw18Im_Q](https://unsplash.com/photos/hVbbw18Im_Q) | [Vivian Mora](https://unsplash.com/@vivian_mora) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 166.3 | `#a1bcb0` |
| gallery-lotus-basin | /gallery · Gallery tile (garden) | [unsplash Ct1Mx5OTn9A](https://unsplash.com/photos/Ct1Mx5OTn9A) | [Saffu](https://unsplash.com/@saffu) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x6293 | 176 | `#aac3bd` |
| gallery-spa-still-life | /gallery · Gallery tile (spa) | [unsplash mgvb4Pga_nM](https://unsplash.com/photos/mgvb4Pga_nM) | [engin akyurt](https://unsplash.com/@enginakyurt) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4032x3024 | 143 | `#aaa599` |
| gallery-wardrobe-robes | /gallery · Gallery tile (rooms) | [unsplash -N8Mc8yGwKQ](https://unsplash.com/photos/-N8Mc8yGwKQ) | [Suzanne Rushton](https://unsplash.com/@suzanne_ella) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4016x6016 | 155.5 | `#b4afa8` |
| gallery-chef-hands | /gallery · Gallery tile (food) | [pexels 10934014](https://www.pexels.com/photo/woman-hand-dressing-meal-10934014/) | [Nadin Sh](https://www.pexels.com/@nadin-sh-78971847/) | pexels | Pexels License (free to use, checked 2026-10-08) | 3150x4200 | 119.1 | `#9a908d` |
| gallery-fruit-basket | /gallery · Gallery tile (food) | [unsplash B77ypBmpYuw](https://unsplash.com/photos/B77ypBmpYuw) | [Jonas Kakaroto](https://unsplash.com/@jkakaroto) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 152 | `#bca87d` |
| gallery-river-rail-cocktails | /gallery · Gallery tile (river, evening allowed) | [pexels 5491012](https://www.pexels.com/photo/delicious-food-with-drinks-in-outdoor-cafe-5491012/) | [Rachel Claire](https://www.pexels.com/@rachel-claire/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2800 | 156.3 | `#a4b2b9` |
| gallery-tea-set | /gallery · Gallery tile (food) | [unsplash YNtVkiN8F0s](https://unsplash.com/photos/YNtVkiN8F0s) | [Suhyeon Choi](https://unsplash.com/@by_syeoni) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2802 | 177.8 | `#cebfa8` |
| gallery-window-seat | /gallery · Gallery tile (rooms) | [unsplash SvbDNnbipj0](https://unsplash.com/photos/SvbDNnbipj0) | [Sixteen Miles Out](https://unsplash.com/@sixteenmilesout) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 181.9 | `#c5c4c5` |
| events-beyond | / · Beyond the rooms: events card | [unsplash uICRbCjNheY](https://unsplash.com/photos/uICRbCjNheY) | [Filipp Romanovski](https://unsplash.com/@filipp_roman_photography) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2801 | 177.2 | `#bec1c3` |
| events-strip-wedding | /events · Strip: weddings (ev.t1) | [pexels 35985252](https://www.pexels.com/photo/scenic-outdoor-wedding-ceremony-setup-in-garden-35985252/) | [Jonathan Borba](https://www.pexels.com/@jonathanborba/) | pexels | Pexels License (free to use, checked 2026-10-08) | 3864x2794 | 144 | `#a2a89d` |
| events-strip-dinner | /events · Strip: private dinners (ev.t2) | [unsplash O38Id_cyV4M](https://unsplash.com/photos/O38Id_cyV4M) | [Photos by Lanty](https://unsplash.com/@photos_by_lanty) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 163.4 | `#bab5a9` |
| events-loy-krathong | /events · Event card: Loy Krathong riverside dinner (evening) | [pexels 19533298](https://www.pexels.com/photo/fresh-food-dishes-on-table-19533298/) | [Augustinus Martinus Noppe](https://www.pexels.com/@capturedbyaugustine/) | pexels | Pexels License (free to use, checked 2026-10-08) | 2800x4200 | 121.8 | `#a0907a` |
| events-songkran-lunch | /events · Event card: Songkran garden lunch | [pexels 38705730](https://www.pexels.com/photo/vibrant-marigold-and-jasmine-flower-garlands-38705730/) | [Dale Mohagan](https://www.pexels.com/@dale/) | pexels | Pexels License (free to use, checked 2026-10-08) | 3072x4096 | 128.4 | `#a8966e` |
| offers-airport-pickup | /offers and / · Offer card 3: direct perk, free airport pickup | [pexels 12369543](https://www.pexels.com/photo/empty-car-seats-12369543/) | [Ammy K](https://www.pexels.com/@ammy-k-106103999/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2800 | 124.2 | `#9e9490` |
| offers-stay-longer | /offers and / · Offer card 2: stay longer | [unsplash QAQQv0x8i0c](https://unsplash.com/photos/QAQQv0x8i0c) | [Sanju Pandita](https://unsplash.com/@spxclicks) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x6300 | 164 | `#b9b6a6` |
| dining-beyond | / · Beyond the rooms: dining card | [pexels 16853260](https://www.pexels.com/photo/restaurant-tables-under-white-umbrellas-16853260/) | [Zsofia Feher](https://www.pexels.com/@zsofia-feher-685822/) | pexels | Pexels License (free to use, checked 2026-10-08) | 3280x2460 | 159.1 | `#aeb3b1` |
| dining-breakfast | /dining · Category strip 16:7: Breakfast on the pier | [unsplash S0e53v8k-VA](https://unsplash.com/photos/S0e53v8k-VA) | [Iason Raissis](https://unsplash.com/@jay_raissis) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x2800 | 202.9 | `#d5d5d4` |
| dining-thai-kitchen | /dining · Category strip 16:7: Thai kitchen | [unsplash -wejEQuvw0E](https://unsplash.com/photos/-wejEQuvw0E) | [Christopher Yiu Chung](https://unsplash.com/@christopher_chung_photography) | unsplash | Unsplash License (premium false, plus false, checked 2026-10-08) | 4200x3022 | 138.4 | `#b29b86` |
| dining-drinks | /dining · Category strip 16:7: Drinks and cocktails | [pexels 5491009](https://www.pexels.com/photo/delicious-cocktails-with-meals-on-table-5491009/) | [Rachel Claire](https://www.pexels.com/@rachel-claire/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2800 | 156.7 | `#abb1b2` |
| og-default | all pages · share card (OG_IMAGE, 1200x630 JPEG cropped at the focal point; mirrors hero-home) | [pexels 7546599](https://www.pexels.com/photo/cozy-resting-place-with-water-view-7546599/) | [Max Vakhtbovych](https://www.pexels.com/@artbovich/) | pexels | Pexels License (free to use, checked 2026-10-08) | 4200x2803 | 130.6 | `#9c9a98` |

## Encoded widths

- hero-home: 640, 960, 1280, 1920, 2560
- hero-home-m: 480, 720, 960, 1200
- hero-rooms: 640, 960, 1280, 1920, 2560
- hero-rooms-m: 480, 720, 960, 1200
- hero-dining: 640, 960, 1280, 1920, 2560
- hero-dining-m: 480, 720, 960, 1200
- hero-dining-reserve: 640, 960, 1280, 1920, 2560
- hero-dining-reserve-m: 480, 720, 960, 1200
- hero-events: 640, 960, 1280, 1920, 2560
- hero-events-m: 480, 720, 960, 1200
- hero-events-reserve: 640, 960, 1280, 1920, 2560
- hero-events-reserve-m: 480, 720, 960, 1200
- hero-gallery: 640, 960, 1280, 1920, 2560
- hero-gallery-m: 480, 720, 960, 1200
- hero-contact: 640, 960, 1280, 1920, 2560
- hero-contact-m: 480, 720, 960, 1200
- hero-account: 480, 720, 960, 1200, 1600
- room-deluxe-king: 480, 768, 1080, 1600, 2048
- room-deluxe-twin: 480, 768, 1080, 1600, 2048
- room-premier-river: 480, 768, 1080, 1600, 2048
- room-junior-suite: 480, 768, 1080, 1600, 2048
- room-teak-suite: 480, 768, 1080, 1600, 2048
- room-royal-teak-suite: 480, 768, 1080, 1600, 2048
- room-deluxe-king-bath: 480, 768, 1080, 1600
- room-deluxe-king-view: 480, 768, 1080, 1600
- room-deluxe-king-detail: 480, 768, 1080, 1600
- room-deluxe-twin-bath: 480, 768, 1080, 1600
- room-deluxe-twin-view: 480, 768, 1080, 1600
- room-deluxe-twin-detail: 480, 768, 1080, 1600
- room-premier-river-bath: 480, 768, 1080, 1600
- room-junior-suite-bath: 480, 768, 1080, 1600
- room-junior-suite-view: 480, 768, 1080, 1600
- room-junior-suite-detail: 480, 768, 1080, 1600
- room-teak-suite-bath: 480, 768, 1080, 1600
- room-teak-suite-view: 480, 768, 1080, 1600
- room-teak-suite-detail: 480, 768, 1080, 1600
- room-royal-teak-suite-bath: 480, 768, 1080, 1600
- room-royal-teak-suite-view: 480, 768, 1080, 1600
- room-royal-teak-suite-detail: 480, 768, 1080, 1600
- dish-rice-soup: 128, 256, 512, 768
- dish-crab-omelette: 128, 256, 512, 768
- dish-fruit-tray: 128, 256, 512, 768
- dish-eggs: 128, 256, 512, 768
- dish-coffee: 128, 256, 512, 768
- dish-pad-thai: 128, 256, 512, 768
- dish-massaman: 128, 256, 512, 768
- dish-grilled-fish: 128, 256, 512, 768
- dish-green-curry: 128, 256, 512, 768
- dish-pomelo-salad: 128, 256, 512, 768
- dish-morning-glory: 128, 256, 512, 768
- dish-tom-yum: 128, 256, 512, 768
- dish-mango-sticky-rice: 128, 256, 512, 768
- dish-sundowner: 128, 256, 512, 768
- dish-lemongrass-cooler: 128, 256, 512, 768
- dish-iced-tea: 128, 256, 512, 768
- dish-beer: 128, 256, 512, 768
- exp-house: 480, 768, 1080, 1600
- exp-about-house: 480, 768, 1080, 1600
- exp-pool: 480, 768, 1080, 1600
- exp-massage: 480, 768, 1080, 1600
- exp-breakfast: 480, 768, 1080, 1600
- exp-team-housekeeping: 480, 768, 1080, 1600
- exp-team-concierge: 480, 768, 1080, 1600
- exp-team-kitchen: 480, 768, 1080, 1600
- fac-lounge: 480, 768, 1080, 1600
- fac-pool: 480, 768, 1080, 1600
- fac-garden: 480, 768, 1080, 1600
- fac-housekeeping: 480, 768, 1080, 1600
- fac-transfer: 480, 768, 1080, 1600
- gallery-palm-shadows: 480, 768, 1080, 1600
- gallery-orchid-console: 480, 768, 1080, 1600
- gallery-teak-corridor: 480, 768, 1080, 1600
- gallery-pool-cabana: 480, 768, 1080, 1600
- gallery-lotus-basin: 480, 768, 1080, 1600
- gallery-spa-still-life: 480, 768, 1080, 1600
- gallery-wardrobe-robes: 480, 768, 1080, 1600
- gallery-chef-hands: 480, 768, 1080, 1600
- gallery-fruit-basket: 480, 768, 1080, 1600
- gallery-river-rail-cocktails: 480, 768, 1080, 1600
- gallery-tea-set: 480, 768, 1080, 1600
- gallery-window-seat: 480, 768, 1080, 1600
- events-beyond: 480, 768, 1080, 1600
- events-strip-wedding: 480, 768, 1080, 1600
- events-strip-dinner: 480, 768, 1080, 1600
- events-loy-krathong: 480, 768, 1080, 1600
- events-songkran-lunch: 480, 768, 1080, 1600
- offers-airport-pickup: 480, 768, 1080, 1600
- offers-stay-longer: 480, 768, 1080, 1600
- dining-beyond: 480, 768, 1080, 1600
- dining-breakfast: 480, 768, 1080, 1600
- dining-thai-kitchen: 480, 768, 1080, 1600
- dining-drinks: 480, 768, 1080, 1600

## Open, dropped and rejected slots

Slots in the brief that have no registered image, and what the design does instead.

- hero-experience, hero-location: rejected (wrong place). /experience opens with a split intro using exp-about-house; /location opens with a typographic intro and a drawn map, no photo.
- hero-facilities, hero-offers, hero-book: no frame passed. These pages open with a typographic intro (no photo); /book needs none.
- fac-pier, fac-luggage: no frame. Listed as text services on /facilities.
- fac-beyond: no frame. The home teaser uses dining-beyond and events-beyond only.
- exp-team-front-desk: no frame. The team is a typographic list with a three-photo behind-the-scenes mosaic.
- exp-longtail, events-jazz-brunch, events-strip-party, gallery-city-skyline, gallery-pool-from-above: dropped by design (the sections are reworked to not need them).
- dish-coconut-pancakes: no frame. That dish shows no photo.
- offers-early-bird: no frame passed; not registered. The early bird offer card has no photo of its own.
- room-premier-river-view and room-premier-river-detail: the river-view frame became hero-home; the Premier River View room shows its two own frames (cover, bath).
- og-default mirrors hero-home: a documented exception (the share card is not a venue image, so the zero-reuse venue rule is unaffected).

## Licences

- Unsplash License: every Unsplash frame was checked as premium false and plus false (2026-10-08). No Unsplash+ frames remain.
- Pexels License: free to use (checked 2026-10-08); one Pexels frame (room-deluxe-king-detail) was uploaded as CC0.
- Neither licence requires attribution; the credits above are kept as good practice and for provenance.
