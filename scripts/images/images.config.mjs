/**
 * The images the registry knows · input to scripts/images/build-images.mjs.
 *
 * The phase 1 registry of the boutique-era photography ("dining/hero",
 * "dishes/pad-thai", ...) was retired in v17 phase 2 once no page used it.
 *
 * Phase 4 (imagery) adds the curated photography: one entry per slot of the
 * ledger (docs/image-ledger.md), the id is the slot name, the master is read
 * from tools/image-masters/ (gitignored), the ground is the ledger's tone and
 * the focal point is the ledger's focal (the page's object-position).
 */

// ---- The curated slots: [id, master in tools/image-masters/, tone, focal] ----

/** Page heroes: natural aspect, plus a 4:5 phone crop "<id>-m" at the focal point. */
const HEROES = [
  // Documented reassignment: the Premier River View frame (Pexels 7546599) is the home hero.
  ["hero-home", "room-premier-river-view.jpg", "#9c9a98", [0.40, 0.50]],
  ["hero-rooms", "hero-rooms.jpg", "#c1beb4", [0.55, 0.55]],
  ["hero-dining", "hero-dining.jpg", "#af9f8e", [0.50, 0.55]],
  ["hero-dining-reserve", "hero-dining-reserve.jpg", "#bbb7b3", [0.45, 0.45]],
  ["hero-events", "hero-events.jpg", "#9f9f94", [0.50, 0.55]],
  ["hero-events-reserve", "hero-events-reserve.jpg", "#b4b2ac", [0.45, 0.50]],
  ["hero-gallery", "hero-gallery.jpg", "#aca796", [0.42, 0.55]],
  ["hero-contact", "hero-contact.jpg", "#9b998d", [0.50, 0.50]],
];

/** The account pages' portrait panel: a 3:4 crop. */
const ACCOUNT = [["hero-account", "hero-account.jpg", "#a4a997", [0.55, 0.60]]];

/** Room covers (cards, the mega menu, the room page lead). */
const ROOM_COVERS = [
  ["room-deluxe-king", "room-deluxe-king.jpg", "#bba890", [0.40, 0.55]],
  ["room-deluxe-twin", "room-deluxe-twin.jpg", "#aba294", [0.40, 0.60]],
  ["room-premier-river", "room-premier-river.jpg", "#c8bfb0", [0.45, 0.60]],
  ["room-junior-suite", "room-junior-suite.jpg", "#c7b4a6", [0.50, 0.55]],
  ["room-teak-suite", "room-teak-suite.jpg", "#9c917e", [0.45, 0.62]],
  ["room-royal-teak-suite", "room-royal-teak-suite.jpg", "#9e9e9b", [0.45, 0.60]],
];

/** The rooms' other frames (bath, view, detail). */
const ROOM_FRAMES = [
  ["room-deluxe-king-bath", "room-deluxe-king-bath.jpg", "#c1baa6", [0.45, 0.55]],
  ["room-deluxe-king-view", "room-deluxe-king-view.jpg", "#9b9a91", [0.50, 0.50]],
  ["room-deluxe-king-detail", "room-deluxe-king-detail.jpg", "#d8c9ba", [0.40, 0.55]],
  ["room-deluxe-twin-bath", "room-deluxe-twin-bath.jpg", "#c6c1b8", [0.50, 0.55]],
  ["room-deluxe-twin-view", "room-deluxe-twin-view.jpg", "#a9a69a", [0.62, 0.65]],
  ["room-deluxe-twin-detail", "room-deluxe-twin-detail.jpg", "#a09d94", [0.35, 0.65]],
  ["room-premier-river-bath", "room-premier-river-bath.jpg", "#c0c1ba", [0.50, 0.60]],
  ["room-junior-suite-bath", "room-junior-suite-bath.jpg", "#bbb0a7", [0.45, 0.60]],
  ["room-junior-suite-view", "room-junior-suite-view.jpg", "#a8b4b8", [0.42, 0.60]],
  ["room-junior-suite-detail", "room-junior-suite-detail.jpg", "#c0b0a1", [0.62, 0.55]],
  ["room-teak-suite-bath", "room-teak-suite-bath.jpg", "#99998f", [0.45, 0.55]],
  ["room-teak-suite-view", "room-teak-suite-view.jpg", "#969c83", [0.50, 0.55]],
  ["room-teak-suite-detail", "room-teak-suite-detail.jpg", "#bfb3a9", [0.55, 0.55]],
  ["room-royal-teak-suite-bath", "room-royal-teak-suite-bath.jpg", "#b9bbb8", [0.50, 0.60]],
  ["room-royal-teak-suite-view", "room-royal-teak-suite-view.jpg", "#909b80", [0.45, 0.62]],
  ["room-royal-teak-suite-detail", "room-royal-teak-suite-detail.jpg", "#aba590", [0.50, 0.60]],
];

/** Dishes and drinks: square crops at the focal point. */
const DISHES = [
  ["dish-rice-soup", "dish-rice-soup.jpg", "#a69e90", [0.50, 0.35]],
  ["dish-crab-omelette", "dish-crab-omelette.jpg", "#c4b09a", [0.45, 0.55]],
  ["dish-fruit-tray", "dish-fruit-tray.jpg", "#bca991", [0.50, 0.55]],
  ["dish-eggs", "dish-eggs.jpg", "#b8b1a1", [0.50, 0.55]],
  ["dish-coffee", "dish-coffee.jpg", "#d0c9c0", [0.50, 0.66]],
  ["dish-pad-thai", "dish-pad-thai.jpg", "#d5c2ad", [0.45, 0.50]],
  ["dish-massaman", "dish-massaman.jpg", "#b6a993", [0.50, 0.50]],
  ["dish-grilled-fish", "dish-grilled-fish.jpg", "#ecebe8", [0.50, 0.50]],
  ["dish-green-curry", "dish-green-curry.jpg", "#a6a493", [0.45, 0.50]],
  ["dish-pomelo-salad", "dish-pomelo-salad.jpg", "#b6adab", [0.55, 0.45]],
  ["dish-morning-glory", "dish-morning-glory.jpg", "#a6a094", [0.55, 0.45]],
  ["dish-tom-yum", "dish-tom-yum.jpg", "#d9ddd7", [0.50, 0.50]],
  ["dish-mango-sticky-rice", "dish-mango-sticky-rice.jpg", "#a5a192", [0.55, 0.50]],
  ["dish-sundowner", "dish-sundowner.jpg", "#cbb695", [0.45, 0.55]],
  ["dish-lemongrass-cooler", "dish-lemongrass-cooler.jpg", "#9ba99a", [0.65, 0.55]],
  ["dish-iced-tea", "dish-iced-tea.jpg", "#e3e0dd", [0.45, 0.70]],
  ["dish-beer", "dish-beer.jpg", "#d0b89a", [0.70, 0.45]],
];

/** Everything else: section frames at their natural aspect. */
const FRAMES = [
  ["exp-house", "exp-house.jpg", "#9aaea7", [0.50, 0.50]],
  ["exp-about-house", "exp-about-house.jpg", "#94927f", [0.40, 0.55]],
  ["exp-pool", "exp-pool.jpg", "#bcbdb2", [0.50, 0.60]],
  ["exp-massage", "exp-massage.jpg", "#d3b8a2", [0.50, 0.40]],
  ["exp-breakfast", "exp-breakfast.jpg", "#cfcfd0", [0.45, 0.55]],
  ["exp-team-housekeeping", "exp-team-housekeeping.jpg", "#aeaead", [0.50, 0.60]],
  ["exp-team-concierge", "exp-team-concierge.jpg", "#c3bebb", [0.18, 0.62]],
  ["exp-team-kitchen", "exp-team-kitchen.jpg", "#a4999b", [0.40, 0.45]],
  ["fac-lounge", "fac-lounge.jpg", "#9a9987", [0.45, 0.65]],
  ["fac-pool", "fac-pool.jpg", "#939b8e", [0.55, 0.55]],
  ["fac-garden", "fac-garden.jpg", "#a5ad9f", [0.50, 0.55]],
  ["fac-housekeeping", "fac-housekeeping.jpg", "#989ea1", [0.55, 0.50]],
  ["fac-transfer", "fac-transfer.jpg", "#8d9196", [0.55, 0.55]],
  ["gallery-palm-shadows", "gallery-palm-shadows.jpg", "#d0c6b6", [0.60, 0.55]],
  ["gallery-orchid-console", "gallery-orchid-console.jpg", "#aaaba6", [0.45, 0.35]],
  ["gallery-teak-corridor", "gallery-teak-corridor.jpg", "#a29e91", [0.55, 0.45]],
  ["gallery-pool-cabana", "gallery-pool-cabana.jpg", "#a1bcb0", [0.45, 0.45]],
  ["gallery-lotus-basin", "gallery-lotus-basin.jpg", "#aac3bd", [0.45, 0.62]],
  ["gallery-spa-still-life", "gallery-spa-still-life.jpg", "#aaa599", [0.50, 0.50]],
  ["gallery-wardrobe-robes", "gallery-wardrobe-robes.jpg", "#b4afa8", [0.62, 0.55]],
  ["gallery-chef-hands", "gallery-chef-hands.jpg", "#9a908d", [0.50, 0.55]],
  ["gallery-fruit-basket", "gallery-fruit-basket.jpg", "#bca87d", [0.50, 0.55]],
  ["gallery-river-rail-cocktails", "gallery-river-rail-cocktails.jpg", "#a4b2b9", [0.48, 0.62]],
  ["gallery-tea-set", "gallery-tea-set.jpg", "#cebfa8", [0.55, 0.55]],
  ["gallery-window-seat", "gallery-window-seat.jpg", "#c5c4c5", [0.35, 0.55]],
  ["events-beyond", "events-beyond.jpg", "#bec1c3", [0.55, 0.55]],
  ["events-strip-wedding", "events-strip-wedding.jpg", "#a2a89d", [0.55, 0.60]],
  ["events-strip-dinner", "events-strip-dinner.jpg", "#bab5a9", [0.55, 0.50]],
  ["events-loy-krathong", "events-loy-krathong.jpg", "#a0907a", [0.45, 0.35]],
  ["events-songkran-lunch", "events-songkran-lunch.jpg", "#a8966e", [0.50, 0.55]],
  ["offers-airport-pickup", "offers-airport-pickup.jpg", "#9e9490", [0.45, 0.60]],
  ["offers-stay-longer", "offers-stay-longer.jpg", "#b9b6a6", [0.55, 0.62]],
  ["dining-beyond", "dining-beyond.jpg", "#aeb3b1", [0.50, 0.50]],
  ["dining-breakfast", "dining-breakfast.jpg", "#d5d5d4", [0.55, 0.50]],
  ["dining-thai-kitchen", "dining-thai-kitchen.jpg", "#b29b86", [0.50, 0.50]],
  ["dining-drinks", "dining-drinks.jpg", "#abb1b2", [0.55, 0.60]],
];

const slot = ([id, master, tone, focal], widths, aspect) => ({
  id,
  master,
  widths,
  tone,
  focal,
  ...(aspect ? { crop: { aspect, focal } } : {}),
});

const W_HERO = [640, 960, 1280, 1920, 2560];
const W_HERO_M = [480, 720, 960, 1200];
const W_ACCOUNT = [480, 720, 960, 1200, 1600];
const W_COVER = [480, 768, 1080, 1600, 2048];
const W_FRAME = [480, 768, 1080, 1600];
const W_DISH = [128, 256, 512, 768];

export const IMAGES = [
  // ---- Phase 4: the curated photography (ids are the ledger's slot names) ----
  ...HEROES.flatMap((s) => [slot(s, W_HERO), slot([`${s[0]}-m`, ...s.slice(1)], W_HERO_M, "4:5")]),
  ...ACCOUNT.map((s) => slot(s, W_ACCOUNT, "3:4")),
  ...ROOM_COVERS.map((s) => slot(s, W_COVER)),
  ...ROOM_FRAMES.map((s) => slot(s, W_FRAME)),
  ...DISHES.map((s) => slot(s, W_DISH, "1:1")),
  ...FRAMES.map((s) => slot(s, W_FRAME)),
];

/** The share card (OG_IMAGE): the home hero, 1200x630 at its focal point. A documented exception. */
export const OG = { master: "room-premier-river-view.jpg", focal: [0.40, 0.50], width: 1200, height: 630 };
