export class SpatialHash {
  private cells = new Map<number, number[]>();
  private used: number[][] = [];
  private xs = new Float64Array(1024);
  private zs = new Float64Array(1024);
  constructor(private cell: number) {}
  private key(cx: number, cz: number) { return (cx + 32768) * 65536 + (cz + 32768); }
  clear() { for (const a of this.used) a.length = 0; this.used.length = 0; }
  insert(id: number, x: number, z: number) {
    if (id >= this.xs.length) {
      const n = Math.max(id + 1, this.xs.length * 2);
      const nx = new Float64Array(n); nx.set(this.xs); this.xs = nx;
      const nz = new Float64Array(n); nz.set(this.zs); this.zs = nz;
    }
    const k = this.key(Math.floor(x / this.cell), Math.floor(z / this.cell));
    let a = this.cells.get(k); if (!a) { a = []; this.cells.set(k, a); }
    if (a.length === 0) this.used.push(a);
    a.push(id); this.xs[id] = x; this.zs[id] = z;
  }
  query(x: number, z: number, r: number, out: number[]): number[] {
    const c = this.cell, r2 = r * r;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c), z0 = Math.floor((z - r) / c), z1 = Math.floor((z + r) / c);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const a = this.cells.get(this.key(cx, cz)); if (!a) continue;
      for (const id of a) { const dx = this.xs[id] - x, dz = this.zs[id] - z; if (dx * dx + dz * dz <= r2) out.push(id); }
    }
    return out;
  }
}
