/**
 * v14 · Seeded thumbnail art for the menu.
 *
 * Keyed by the seeded dish id, so the map only ever applies to the demo's own
 * dishes · a dish the owner creates has no entry and simply shows no
 * thumbnail, which is the intended behaviour (the menu must stay elegant, and
 * a missing thumbnail is better than a wrong one).
 *
 * An uploaded `dish.image` always wins over this map. Files are square crops
 * encoded locally at 128 and 256 by scripts/build-facility-images.js.
 */
export const DISH_ART: Record<string, { base: string; alt: string }> = {
  // Breakfast on the pier
  "dc-pier-breakfast-i1": {
    base: "/images/dishes/rice-soup",
    alt: "Rice soup with river prawns in a claypot",
  },
  "dc-pier-breakfast-i2": {
    base: "/images/dishes/crab-omelette",
    alt: "Thai omelette served over rice",
  },
  "dc-pier-breakfast-i3": {
    base: "/images/dishes/fruit-tray",
    alt: "Sliced tropical fruit on a plate",
  },
  "dc-pier-breakfast-i4": {
    base: "/images/dishes/coconut-pancakes",
    alt: "Small coconut pancakes",
  },
  "dc-pier-breakfast-i5": {
    base: "/images/dishes/eggs",
    alt: "Eggs and toast on a breakfast plate",
  },
  "dc-pier-breakfast-i6": {
    base: "/images/dishes/coffee",
    alt: "A cup of filter coffee",
  },

  // Thai kitchen
  "dc-thai-kitchen-i1": {
    base: "/images/dishes/pad-thai",
    alt: "Pad thai noodles with prawns",
  },
  "dc-thai-kitchen-i2": {
    base: "/images/dishes/massaman",
    alt: "Massaman curry with beef",
  },
  "dc-thai-kitchen-i3": {
    base: "/images/dishes/grilled-fish",
    alt: "Whole grilled fish",
  },
  "dc-thai-kitchen-i4": {
    base: "/images/dishes/green-curry",
    alt: "Green curry with chicken",
  },
  "dc-thai-kitchen-i5": {
    base: "/images/dishes/pomelo-salad",
    alt: "Pomelo salad on a plate",
  },
  "dc-thai-kitchen-i6": {
    base: "/images/dishes/morning-glory",
    alt: "Stir-fried morning glory",
  },
  "dc-thai-kitchen-i7": {
    base: "/images/dishes/tom-yum",
    alt: "Tom yum soup with river prawns",
  },
  "dc-thai-kitchen-i8": {
    base: "/images/dishes/mango-sticky-rice",
    alt: "Mango with coconut sticky rice",
  },

  // Drinks & cocktails
  "dc-drinks-i1": {
    base: "/images/dishes/sundowner",
    alt: "A cocktail in a coupe glass",
  },
  "dc-drinks-i2": {
    base: "/images/dishes/lemongrass-cooler",
    alt: "An iced herbal cooler",
  },
  "dc-drinks-i3": {
    base: "/images/dishes/iced-tea",
    alt: "A glass of iced tea",
  },
  "dc-drinks-i4": {
    base: "/images/dishes/beer",
    alt: "A cold beer",
  },
};

export function dishArt(id: string) {
  return DISH_ART[id];
}
