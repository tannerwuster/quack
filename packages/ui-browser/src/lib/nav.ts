// Small pure helpers for keyboard navigation through files and comment
// threads. Kept separate from React so they're easy to unit-test.

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

/** Step an index by ±1, clamped to the list bounds (no wrap). */
export const stepIndex = (
  length: number,
  current: number,
  dir: 1 | -1,
): number => {
  if (length === 0) return -1;
  if (current < 0) return dir === 1 ? 0 : length - 1;
  return clamp(current + dir, 0, length - 1);
};

/**
 * Find the next index (wrapping once) after `fromIndex` in `dir` whose item
 * satisfies `pred`. Returns -1 if nothing matches. `fromIndex` itself is not
 * considered (so repeated calls advance).
 */
export const nextMatching = <T>(
  items: readonly T[],
  fromIndex: number,
  dir: 1 | -1,
  pred: (item: T) => boolean,
): number => {
  const n = items.length;
  if (n === 0) return -1;
  for (let i = 1; i <= n; i++) {
    const idx = (((fromIndex + dir * i) % n) + n) % n;
    const item = items[idx];
    if (item !== undefined && pred(item)) return idx;
  }
  return -1;
};
