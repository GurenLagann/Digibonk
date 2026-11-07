import type { SaveData } from './core/save';
import { PARTNERS } from './data/partners';
import type { Season } from './data/types';

export type AppScreen = 'title' | 'season' | 'partner' | 'run' | 'results' | 'settings' | 'credits';

export function createApp(deps: { save: SaveData; storage: Storage | null; startRun(partnerId: string): void }) {
  let screen: AppScreen = 'title';
  let season: Season = 'adventure';
  const partnersFor = (s: Season) => PARTNERS.filter(p => p.season === s).map(p => ({ id: p.id, locked: !deps.save.unlocked.includes(p.id) }));
  return {
    screen: () => screen,
    season: () => season,
    go(s: AppScreen) { screen = s; },
    selectSeason(s: Season) { season = s; screen = 'partner'; },
    partnersFor,
    pickPartner(id: string): boolean {
      const p = partnersFor(season).find(x => x.id === id);
      if (!p || p.locked) return false;
      screen = 'run'; deps.startRun(id); return true;
    },
  };
}
export type App = ReturnType<typeof createApp>;
