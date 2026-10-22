/** Rounds an axis maximum up to a clean value and returns ~4 evenly spaced ticks from 0. */
export const niceTicks = (max: number, targetCount = 4): number[] => {
  if (max <= 0) {
    return [0, 1];
  }

  const rough = max / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const count = Math.ceil(max / step);
  return Array.from({ length: count + 1 }, (_, i) => i * step);
};

export const linear =
  (domain: [number, number], range: [number, number]) =>
  (value: number): number => {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    return d1 === d0 ? r0 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
  };

/** SVG path for a column with a 4px rounded top and a square base. */
export const columnPath = (x: number, y: number, width: number, baseline: number): string => {
  const height = baseline - y;
  const r = Math.min(4, width / 2, height);
  if (height <= 0) {
    return '';
  }
  return [
    `M${x},${baseline}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${baseline}`,
    'Z',
  ].join(' ');
};
