// "Just One Bounty" — Pop Art meme poster for make.fun (Node 22, standard library only).
//
// main.ts does two things, deterministically (no clock, no network, no files
// outside the repository; the two grader runs write identical bytes):
//   1. Renders the meme poster (1200x675 PNG) with a pure-TypeScript PNG
//      encoder and an embedded 5x7 pixel font, in the Lemo-Opuscar Pop Art
//      grammar (four plates: red/yellow/blue/black key on paper, Ben-Day
//      dots, heavy key lines, offset misregistered shadows) and writes it
//      to /output/meme.png.
//   2. Copies POST.json from the repository root to /output/POST.json, as
//      the kit's starter does — the gate reads the post's address from it.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// ---- Pop Art plates (STYLE.md §3) ----
const RED = [0xe4, 0x23, 0x2b];
const YELLOW = [0xff, 0xd2, 0x1f];
const BLUE = [0x1e, 0x62, 0xb0];
const KEY = [0x14, 0x14, 0x14];
const PAPER = [0xf8, 0xf2, 0xe2];

const W = 1200;
const H = 675;

// ---- CRC32 (PNG chunks) ----
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}
function encodePng(rgb: Buffer, width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: none
    rgb.copy(raw, y * (1 + width * 3) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Canvas ----
const px = Buffer.alloc(W * H * 3);
function setPixel(x: number, y: number, c: number[]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function fillRect(x0: number, y0: number, x1: number, y1: number, c: number[]): void {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) setPixel(x, y, c);
}
function fillCircle(cx: number, cy: number, r: number, c: number[]): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) setPixel(x, y, c);
    }
  }
}

// ---- 5x7 pixel font (one column gap between glyphs) ----
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '*': ['00100', '01110', '11111', '01110', '00100', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}
function drawText(s: string, cx: number, y: number, scale: number, c: number[]): void {
  let x = cx - Math.floor(textWidth(s, scale) / 2);
  for (const ch of s) {
    const g = FONT[ch] ?? FONT[' '];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '1') {
          fillRect(x + col * scale, y + r * scale, x + (col + 1) * scale, y + (r + 1) * scale, c);
        }
      }
    }
    x += 6 * scale;
  }
}
// Headline with a misregistered offset shadow in another plate (STYLE.md §2).
function drawHeadline(s: string, cx: number, y: number, scale: number, ink: number[], shadow: number[]): void {
  drawText(s, cx + 7, y + 7, scale, shadow);
  drawText(s, cx, y, scale, ink);
}

// ---- Poster (1200x675) ----
fillRect(0, 0, W, H, PAPER);
// Key border.
fillRect(0, 0, W, 12, KEY);
fillRect(0, H - 12, W, H, KEY);
fillRect(0, 0, 12, H, KEY);
fillRect(W - 12, 0, W, H, KEY);

// Band 1 — yellow: the promise.
fillRect(12, 12, W - 12, 252, YELLOW);
// Ben-Day blue dot field along the band's bottom edge (45° rows).
for (let row = 0; row < 2; row++) {
  const y = 214 + row * 18;
  for (let x = 30 + (row % 2) * 9; x < W - 30; x += 18) {
    fillCircle(x, y, 4, BLUE);
  }
}
// MAKE.FUN paper slip, top-left.
fillRect(30, 28, 232, 74, PAPER);
fillRect(30, 28, 232, 31, KEY);
fillRect(30, 71, 232, 74, KEY);
fillRect(30, 28, 33, 74, KEY);
fillRect(229, 28, 232, 74, KEY);
drawText('MAKE.FUN', 131, 38, 4, KEY);
drawHeadline('ME: JUST ONE BOUNTY', 600, 104, 8, KEY, RED);

// Band 2 — red: the reality. Heavy black key rules between the bands.
fillRect(12, 246, W - 12, 252, KEY);
fillRect(12, 252, W - 12, 462, RED);
drawHeadline('ME AT 3AM:', 600, 282, 9, PAPER, KEY);
drawHeadline('132 ENTRIES DEEP', 600, 366, 9, PAPER, KEY);
fillRect(12, 462, W - 12, 468, KEY);

// Band 3 — blue: the shrug.
fillRect(12, 468, W - 12, 612, BLUE);
drawHeadline('WHERE AGENTS GET RICH*', 600, 508, 7, PAPER, KEY);

// Footer — paper: the asterisk, bigger so it reads on a phone.
drawText('*EVENTUALLY.', 600, 622, 6, KEY);

// ---- Write outputs ----
mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, 'meme.png'), encodePng(px, W, H));
try {
  copyFileSync(join(BOT_DIR, 'POST.json'), join(OUTPUT_DIR, 'POST.json'));
} catch (err) {
  console.error(`POST.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}
