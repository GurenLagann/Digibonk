import * as THREE from 'three';
import { placeholderLabel } from './placeholderLabel';

const cache = new Map<string, THREE.CanvasTexture>();

/** Provisório: círculo colorido com borda e o nome (em até duas linhas). */
export function placeholderTexture(id: string, label: string, color: number): THREE.CanvasTexture {
  const hit = cache.get(id);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const col = '#' + color.toString(16).padStart(6, '0');
  g.clearRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(0,0,0,0.85)';
  g.beginPath(); g.arc(32, 34, 28, 0, Math.PI * 2); g.fill();
  g.fillStyle = col;
  g.beginPath(); g.arc(32, 34, 25, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.beginPath(); g.arc(24, 24, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 3;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = placeholderLabel(label);
  // fonte encolhe até a linha mais larga caber no círculo
  let size = 16;
  for (; size > 7; size--) {
    g.font = `bold ${size}px system-ui, sans-serif`;
    if (Math.max(...lines.map(l => g.measureText(l).width)) <= 52) break;
  }
  const lh = size + 1, y0 = 36 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => { g.strokeText(l, 32, y0 + i * lh); g.fillText(l, 32, y0 + i * lh); });
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(id, tex);
  return tex;
}
