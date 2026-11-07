import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

/** Provisório: círculo colorido com borda e as 3 primeiras letras. */
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
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 4;
  g.font = 'bold 18px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const t = label.slice(0, 3).toUpperCase();
  g.strokeText(t, 32, 38); g.fillText(t, 32, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(id, tex);
  return tex;
}
