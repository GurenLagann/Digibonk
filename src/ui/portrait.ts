import { FORMS } from '../data/forms';
import { placeholderLabel } from '../render/placeholderLabel';
import type { SpriteLibrary } from '../render/sprites';

let source: SpriteLibrary | null = null;
/** biblioteca de sprites usada pelos retratos dos menus (null → só placeholders) */
export function setPortraitSource(lib: SpriteLibrary | null): void { source = lib; }

const CYAN = '#00d9ff';
const hex = (n: number) => '#' + (n >>> 0 & 0xffffff).toString(16).padStart(6, '0');

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D | null {
  try { return c.getContext('2d'); } catch { return null; }
}

/**
 * Retrato de uma forma: quadro idle1 (ou o primeiro) da tira, pixelado, centrado e com escala inteira até `size`.
 * Sem sprite → círculo com a cor da forma e o nome. `silhouette` → preto com contorno ciano (forma bloqueada).
 */
export function portrait(formId: string, opts: { size?: number; silhouette?: boolean } = {}): HTMLCanvasElement {
  const size = Math.max(1, Math.round(opts.size ?? 64));
  const silhouette = !!opts.silhouette;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  c.className = 'b2-portrait';
  c.setAttribute('data-form', formId);
  const g = ctx2d(c);
  if (!g) return c;
  try {
    if (!drawSprite(g, formId, size, silhouette)) drawPlaceholder(g, formId, size, silhouette);
  } catch { /* canvas parcial (ambiente sem canvas completo): devolve o que deu */ }
  return c;
}

function drawSprite(g: CanvasRenderingContext2D, formId: string, size: number, silhouette: boolean): boolean {
  const info = source?.info(formId);
  const img = source?.image(formId);
  if (!info || !img || !img.complete || !img.naturalWidth) return false;
  const frame = Math.max(0, info.frames.indexOf('idle1'));
  const pad = silhouette ? 2 : 0; // espaço para o contorno
  const room = size - pad * 2;
  const fit = room / Math.max(info.frameW, info.frameH);
  const scale = fit >= 1 ? Math.floor(fit) : fit; // inteiro quando cabe; quadro maior que o retrato reduz
  const w = Math.round(info.frameW * scale), hgt = Math.round(info.frameH * scale);
  const x = Math.floor((size - w) / 2), y = Math.floor((size - hgt) / 2);
  const blit = (t: CanvasRenderingContext2D, dx: number, dy: number) => {
    t.imageSmoothingEnabled = false;
    t.drawImage(img, frame * info.frameW, 0, info.frameW, info.frameH, dx, dy, w, hgt);
  };
  if (!silhouette) { blit(g, x, y); return true; }
  // silhueta: pinta o quadro de uma cor só (source-in) num canvas auxiliar e carimba ciano em volta, preto por cima
  const tint = (color: string) => {
    const t = document.createElement('canvas'); t.width = size; t.height = size;
    const tg = t.getContext('2d'); if (!tg) return null;
    blit(tg, x, y);
    tg.globalCompositeOperation = 'source-in'; tg.fillStyle = color; tg.fillRect(0, 0, size, size);
    return t;
  };
  const glow = tint(CYAN), body = tint('#000');
  if (!glow || !body) return false;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) g.drawImage(glow, dx, dy);
  g.drawImage(body, 0, 0);
  return true;
}

function drawPlaceholder(g: CanvasRenderingContext2D, formId: string, size: number, silhouette: boolean) {
  const form = FORMS[formId];
  const r = size / 2 - Math.max(1.5, size / 32);
  g.beginPath(); g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  g.fillStyle = silhouette ? '#000' : form ? hex(form.color) : '#3a4a66';
  g.fill();
  g.lineWidth = Math.max(1.5, size / 32);
  g.strokeStyle = silhouette ? CYAN : 'rgba(255,255,255,.55)';
  g.stroke();
  const lines = silhouette ? ['?'] : placeholderLabel(form?.name ?? formId);
  const longest = Math.max(...lines.map(l => l.length));
  const px = Math.max(7, Math.min(size * (silhouette ? 0.45 : 0.22), (r * 1.7) / (longest * 0.6)));
  g.font = `italic 900 ${px}px "Exo 2", system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = silhouette ? CYAN : '#fff';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 2;
  const lh = px * 1.05;
  lines.forEach((l, i) => g.fillText(l, size / 2, size / 2 + (i - (lines.length - 1) / 2) * lh));
}
