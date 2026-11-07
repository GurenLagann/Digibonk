export function fakeStorage(init: Record<string, string>): Storage {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => { m.delete(k); },
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
  };
}

import { newPlayerProg, type PlayerProg } from '../src/sim/progression';
import { FORMS } from '../src/data/forms';

export function progAt(formId: string, level: number): PlayerProg {
  const p = newPlayerProg(formId); p.level = level; return p;
}
export function maxedProg(formId: string): PlayerProg {
  const p = newPlayerProg(formId);
  const f = FORMS[formId];
  p.slots = [f.signature, ...f.kit].map(moveId => ({ moveId, level: 5, fromCard: false }));
  return p;
}
