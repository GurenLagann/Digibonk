import type { SaveData } from './core/save';
import { PARTNERS } from './data/partners';
import type { Season } from './data/types';

export type AppScreen = 'title' | 'partner' | 'records' | 'run' | 'results' | 'settings' | 'credits';

const SEASON_ORDER: Season[] = ['adventure', 'adventure02', 'tamers'];

export function createApp(deps: { save: SaveData; storage: Storage | null; startRun(partnerId: string): void }) {
  let screen: AppScreen = 'title';
  /** todos os parceiros, por temporada e, dentro dela, na ordem de PARTNERS */
  const partners = () => SEASON_ORDER.flatMap(s => PARTNERS.filter(p => p.season === s))
    .map(p => ({ id: p.id, childForm: p.childForm, season: p.season as Season, locked: !deps.save.unlocked.includes(p.id) }));
  return {
    screen: () => screen,
    go(s: AppScreen) { screen = s; },
    partners,
    pickPartner(id: string): boolean {
      const p = partners().find(x => x.id === id);
      if (!p || p.locked) return false;
      screen = 'run'; deps.startRun(id); return true;
    },
  };
}
export type App = ReturnType<typeof createApp>;
