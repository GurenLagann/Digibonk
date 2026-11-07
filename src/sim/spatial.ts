export class SpatialHash {
  private cells = new Map<number, number[]>();
  private pos = new Map<number, [number, number]>();
  constructor(private cell: number) {}
  private key(cx: number, cz: number) { return (cx + 32768) * 65536 + (cz + 32768); }
  clear() { this.cells.clear(); this.pos.clear(); }
  insert(id: number, x: number, z: number) {
    const k = this.key(Math.floor(x / this.cell), Math.floor(z / this.cell));
    let a = this.cells.get(k); if (!a) { a = []; this.cells.set(k, a); }
    a.push(id); this.pos.set(id, [x, z]);
  }
  query(x: number, z: number, r: number, out: number[]): number[] {
    const c = this.cell, r2 = r * r;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c), z0 = Math.floor((z - r) / c), z1 = Math.floor((z + r) / c);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const a = this.cells.get(this.key(cx, cz)); if (!a) continue;
      for (const id of a) { const p = this.pos.get(id)!; if ((p[0] - x) ** 2 + (p[1] - z) ** 2 <= r2) out.push(id); }
    }
    return out;
  }
}
