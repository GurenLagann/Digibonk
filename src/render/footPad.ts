/**
 * Espaço transparente abaixo dos pés em cada quadro da folha. As folhas trazem
 * margem embaixo (até ~37% da altura); como o quadro é ancorado pela borda de
 * baixo, o desenho flutuava. O render desce o sprite por essa fração.
 */
export interface Pixels { width: number; height: number; data: ArrayLike<number> }

/** pixel com alfa abaixo disso é franja e não conta como pé */
const ALPHA_MIN = 128;

/** fração (0–1) da altura do quadro vazia abaixo do pixel opaco mais baixo; quadro vazio = 0 */
export function footPads(px: Pixels, frameCount: number, cols: number, rows: number): number[] {
  const cw = Math.floor(px.width / cols), ch = Math.floor(px.height / rows);
  const out: number[] = [];
  for (let i = 0; i < frameCount; i++) {
    const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch;
    let pad = 0;
    scan: for (let y = ch - 1; y >= 0; y--) {
      for (let x = 0; x < cw; x++) if (px.data[((y0 + y) * px.width + x0 + x) * 4 + 3] >= ALPHA_MIN) { pad = (ch - 1 - y) / ch; break scan; }
      if (y === 0) pad = 0;
    }
    out.push(pad);
  }
  return out;
}

/** pixels da imagem via canvas (null fora do navegador ou se o canvas falhar) */
export function readPixels(img: HTMLImageElement): Pixels | null {
  try {
    const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const g = c.getContext('2d'); if (!g || !c.width || !c.height) return null;
    g.drawImage(img, 0, 0);
    return g.getImageData(0, 0, c.width, c.height);
  } catch { return null; }
}
