export function createFixedLoop(step: number, maxFrame: number, tick: (dt: number) => void) {
  let acc = 0;
  return {
    advance(realDt: number): number {
      acc += Math.min(Math.max(realDt, 0), maxFrame);
      let n = 0;
      while (acc >= step - 1e-9) { acc -= step; tick(step); n++; }
      return n;
    },
  };
}
