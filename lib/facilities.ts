/**
 * The seven things the house keeps · one list, used by the /facilities page and
 * the home strip so the two can never drift apart.
 *
 * `key` is the dictionary prefix: `${key}.h` is the name, `${key}.p` the first
 * line, `${key}.p2` the second. `base` is the local image path without the
 * width/extension suffix (see components/LocalPicture).
 */
export type Facility = {
  base: string;
  key: string;
  alt: string;
};

export const FACILITIES: Facility[] = [
  {
    base: "/images/facilities/pool",
    key: "fac.pool",
    alt: "Saltwater pool in the courtyard",
  },
  {
    base: "/images/facilities/pier-breakfast",
    key: "fac.pier",
    alt: "Breakfast tables on the river pier",
  },
  {
    base: "/images/facilities/courtyard-garden",
    key: "fac.garden",
    alt: "Flowering courtyard garden",
  },
  {
    base: "/images/facilities/lobby-lounge",
    key: "fac.lounge",
    alt: "Teak lobby lounge with armchairs",
  },
  {
    base: "/images/facilities/airport-transfer",
    key: "fac.transfer",
    alt: "Private car for airport transfer",
  },
  {
    base: "/images/facilities/housekeeping",
    key: "fac.housekeeping",
    alt: "Folded linen for daily housekeeping",
  },
  {
    base: "/images/facilities/luggage-storage",
    key: "fac.luggage",
    alt: "Guest luggage stored behind the desk",
  },
];
