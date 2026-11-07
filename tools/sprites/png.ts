import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import type { Image } from './slice.ts';

export function readPng(path: string): Image {
  const png = PNG.sync.read(readFileSync(path));
  return { w: png.width, h: png.height, data: new Uint8Array(png.data) };
}
export function encodePng(img: Image): Buffer {
  const png = new PNG({ width: img.w, height: img.h });
  png.data = Buffer.from(img.data);
  return PNG.sync.write(png, { colorType: 6 });
}
export function writePng(path: string, img: Image): void { writeFileSync(path, encodePng(img)); }
