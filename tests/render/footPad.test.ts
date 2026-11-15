import { footPads } from '../../src/render/footPad';

/** folha RGBA com quadros de cellW×cellH; `fill` pinta um retângulo opaco num quadro */
function sheet(cols: number, rows: number, cellW: number, cellH: number) {
  const width = cols * cellW, height = rows * cellH, data = new Uint8ClampedArray(width * height * 4);
  const fill = (frame: number, x0: number, y0: number, x1: number, y1: number, alpha = 255) => {
    const cx = (frame % cols) * cellW, cy = Math.floor(frame / cols) * cellH;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data[((cy + y) * width + cx + x) * 4 + 3] = alpha;
  };
  return { px: { width, height, data }, fill };
}

test('fração vazia abaixo do pixel opaco mais baixo, por quadro', () => {
  const { px, fill } = sheet(2, 2, 10, 20);
  fill(0, 2, 0, 8, 20);   // encosta no fundo
  fill(1, 2, 0, 8, 15);   // 5 linhas vazias embaixo
  fill(2, 2, 3, 8, 10);   // 10 linhas vazias
  fill(3, 0, 0, 10, 18);  // 2 linhas vazias
  expect(footPads(px, 4, 2, 2)).toEqual([0, 0.25, 0.5, 0.1]);
});

test('ignora pixels quase transparentes (franja) e quadro vazio fica em 0', () => {
  const { px, fill } = sheet(3, 1, 10, 10);
  fill(0, 0, 0, 10, 6);
  fill(0, 0, 6, 10, 10, 40); // franja fraca embaixo não conta
  expect(footPads(px, 3, 3, 1)).toEqual([0.4, 0, 0]);
});

test('última linha incompleta da grade: só os quadros existentes', () => {
  const { px, fill } = sheet(2, 2, 4, 4);
  fill(2, 0, 0, 4, 2);
  expect(footPads(px, 3, 2, 2)).toEqual([0, 0, 0.5]);
});
