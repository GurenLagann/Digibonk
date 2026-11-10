/**
 * Gera o painel dos devs (docs/painel/index.html): planos, próximos passos, pendências, gráficos de sprites e as
 * linhas de digievolução com miniatura de cada sprite. Rodar da raiz: `npm run painel` (ou `-- --sem-testes`).
 * Texto curado (planos, próximos passos, pendências) fica em tools/painel/conteudo.json.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { encodePng, readPng } from '../sprites/png.ts';
import type { Image } from '../sprites/slice.ts';
import { buildData, frameIndex, type SpriteInfo } from './dados.ts';

const OUT = 'docs/painel/index.html';
const manifest: Record<string, SpriteInfo> = JSON.parse(readFileSync('public/sprites/manifest.json', 'utf8')).sprites;
const sheets = new Map<string, Image>();

/** recorta o quadro parado da folha, apara a borda transparente e devolve como data URI */
function thumb(_id: string, s: SpriteInfo): string | null {
  try {
    let img = sheets.get(s.file);
    if (!img) { img = readPng(`public/sprites/${s.file}`); sheets.set(s.file, img); }
    // folha em grade: coluna e linha do quadro (cols ausente = tudo numa linha)
    const cols = Math.min(s.cols ?? s.frames.length, s.frames.length), fi = frameIndex(s.frames);
    const fx = (fi % cols) * s.frameW, fy = Math.floor(fi / cols) * s.frameH;
    let x0 = s.frameW, y0 = s.frameH, x1 = -1, y1 = -1;
    for (let y = 0; y < s.frameH; y++) for (let x = 0; x < s.frameW; x++) {
      if (img.data[(((fy + y) * img.w) + fx + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    if (x1 < 0) return null;
    const w = x1 - x0 + 1, h = y1 - y0 + 1, data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = (((fy + y0 + y) * img.w) + fx + x0 + x) * 4, di = (y * w + x) * 4;
      data.set(img.data.subarray(si, si + 4), di);
    }
    return `data:image/png;base64,${encodePng({ w, h, data }).toString('base64')}`;
  } catch { return null; }
}

const git = (cmd: string) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim(); } catch { return '?'; } };
let tests = '—';
if (!process.argv.includes('--sem-testes')) {
  try {
    const out = execSync('npx vitest run 2>&1 || true', { encoding: 'utf8', shell: '/bin/sh' });
    tests = out.match(/Tests\s+(\d+) passed/)?.[1] ?? '—';
  } catch { /* sem contagem */ }
}

const data = buildData(manifest, thumb);
const content = JSON.parse(readFileSync('tools/painel/conteudo.json', 'utf8'));
const done = Object.values(data.forms).filter(f => f.sp.st === 'done').length;
const vars: Record<string, string> = {
  __DATA__: JSON.stringify(data), __CONTENT__: JSON.stringify(content),
  __HEAD__: git('rev-parse --short HEAD'), __COMMITS__: git('rev-list --count HEAD'),
  __REMOTE__: git('rev-parse --short origin/main'), __AHEAD__: git('rev-list --count origin/main..HEAD'),
  __TESTS__: tests, __FORMS__: String(Object.keys(data.forms).length), __SPRITEDONE__: String(done), __UPDATED__: content.atualizado,
};
let html = readFileSync('tools/painel/template.html', 'utf8');
for (const [k, v] of Object.entries(vars)) html = html.split(k).join(v);
mkdirSync('docs/painel', { recursive: true });
writeFileSync(OUT, html);
console.log(`${OUT}: ${Math.round(html.length / 1024)} KB · ${Object.keys(data.forms).length} formas · ${tests} testes`);
