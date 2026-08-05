export function qrMockSvg(): string {
  let cells = "";
  let seed = 7;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const finder =
        (x < 7 && y < 7) ||
        (x > 13 && y < 7) ||
        (x < 7 && y > 13);
      const on = finder
        ? (x % 6 === 0 ||
            y % 6 === 0 ||
            (x % 6 > 1 && x % 6 < 5 && y % 6 > 1 && y % 6 < 5))
          ? 1
          : 0
        : rnd() > 0.52
          ? 1
          : 0;
      if (on) {
        cells += `<rect x="${x}" y="${y}" width="1" height="1" fill="#12211C"/>`;
      }
    }
  }
  return cells;
}

export function generateBookingCode(): string {
  return `TKH-${1000 + Math.floor(Math.random() * 9000)}`;
}
