/** Picks a clean step (1, 2, 2.5 or 5 × 10ⁿ) giving at most `targetCount + 1` intervals with
 * the lowest top, and returns the ticks from 0 to that top. */
export const niceTicks = (max: number, targetCount = 4): number[] => {
  if (max <= 0) {
    return [0, 1];
  }

  const magnitude = 10 ** Math.floor(Math.log10(max / targetCount));
  const candidates = [1, 2, 2.5, 5, 10, 20]
    .map((multiplier) => multiplier * magnitude)
    .map((step) => ({ step, count: Math.ceil(max / step) }))
    .filter(({ count }) => count >= 2 && count <= targetCount + 1);
  const { step, count } = candidates.reduce((best, candidate) =>
    candidate.step * candidate.count < best.step * best.count ? candidate : best,
  );
  return Array.from({ length: count + 1 }, (_, i) => i * step);
};

export const linear =
  (domain: [number, number], range: [number, number]) =>
  (value: number): number => {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    return d1 === d0 ? r0 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
  };

/** SVG path for a column: square, like the rest of the Coutumes look. */
export const columnPath = (x: number, y: number, width: number, baseline: number): string =>
  baseline - y <= 0 ? '' : `M${x},${baseline} V${y} H${x + width} V${baseline} Z`;
