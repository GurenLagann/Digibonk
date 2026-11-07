type Child = Node | string | null | undefined | false;
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, unknown> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(c));
  return el;
}
export const STAT_NAMES = { hp: 'Vida', atk: 'Ataque', def: 'Defesa', spd: 'Velocidade', brain: 'Cérebro' } as const;
export const PATTERN_NAMES = { projectile: 'projétil', area: 'área', cone: 'golpe em cone', aura: 'aura', orbital: 'orbital', beam: 'raio' } as const;
export const STAGE_NAMES = { child: 'Child', adult: 'Adult', perfect: 'Perfect', ultimate: 'Ultimate' } as const;
export function fmtTime(t: number) { const s = Math.max(0, Math.floor(t)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
