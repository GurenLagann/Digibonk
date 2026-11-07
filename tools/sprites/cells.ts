import { readPng } from './png.ts';
const im = readPng(process.argv[2]);
const isG = (i: number) => { const r = im.data[i], g = im.data[i + 1], b = im.data[i + 2]; return g > 190 && r < 130 && b > 110 && b < 210; };
// a cell = maximal run of green along a row & column; collect via flood fill on green mask
const seen = new Uint8Array(im.w * im.h); const cells: number[][] = [];
for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
  const p = y * im.w + x; if (seen[p] || !isG(p * 4)) continue;
  let x0 = x, x1 = x, y0 = y, y1 = y, n = 0; const st = [p]; seen[p] = 1;
  while (st.length) { const q = st.pop()!; n++; const qx = q % im.w, qy = (q / im.w) | 0;
    x0 = Math.min(x0, qx); x1 = Math.max(x1, qx); y0 = Math.min(y0, qy); y1 = Math.max(y1, qy);
    for (const d of [q - 1, q + 1, q - im.w, q + im.w]) if (d >= 0 && d < seen.length && !seen[d] && Math.abs((d % im.w) - qx) <= 1 && isG(d * 4)) { seen[d] = 1; st.push(d); } }
  if (x1 - x0 > 50 && y1 - y0 > 50) cells.push([x0, y0, x1 - x0 + 1, y1 - y0 + 1]);
}
cells.sort((a, b) => Math.round(a[1] / 40) - Math.round(b[1] / 40) || a[0] - b[0]);
cells.forEach((c, i) => console.log(i, c.join(',')));
