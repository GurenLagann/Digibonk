export interface Rng {
  next(): number;
  int(min: number, maxIncl: number): number;
  pick<T>(arr: readonly T[]): T;
  weighted<T>(items: readonly T[], weight: (t: T) => number): T;
}

/** mulberry32 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, maxIncl) => min + Math.floor(next() * (maxIncl - min + 1)),
    pick: arr => arr[Math.floor(next() * arr.length)],
    weighted(items, weight) {
      let total = 0;
      for (const it of items) total += Math.max(0, weight(it));
      let r = next() * total;
      for (const it of items) {
        const w = Math.max(0, weight(it));
        if (w <= 0) continue;
        if (r < w) return it;
        r -= w;
      }
      for (let i = items.length - 1; i >= 0; i--) if (weight(items[i]) > 0) return items[i];
      return items[items.length - 1];
    },
  };
}
