import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");
mkdirSync(outDir, { recursive: true });

const FIRE = [232, 86, 42];
const CREAM = [255, 250, 247];
const BG = [248, 246, 244];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, draw) {
  const bytesPerRow = size * 4;
  const raw = Buffer.alloc((bytesPerRow + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (bytesPerRow + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y, size);
      const p = rowStart + 1 + x * 4;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
      raw[p + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function letterF(x, y, size, fg, bg, bgAlpha) {
  const u = size / 16;
  const inStem = x >= 6 * u && x < 8 * u && y >= 3 * u && y < 13 * u;
  const inTop = y >= 3 * u && y < 5 * u && x >= 6 * u && x < 11 * u;
  const inMid = y >= 7 * u && y < 9 * u && x >= 6 * u && x < 10 * u;
  if (inStem || inTop || inMid) return [...fg, 255];
  return [...bg, bgAlpha];
}

const targets = [
  { name: "icon.png", size: 1024, bg: FIRE, fg: CREAM, alpha: 255 },
  { name: "adaptive-icon.png", size: 1024, bg: FIRE, fg: CREAM, alpha: 255 },
  { name: "splash.png", size: 1024, bg: BG, fg: FIRE, alpha: 255 },
  { name: "notification-icon.png", size: 96, bg: [0, 0, 0], fg: CREAM, alpha: 0 },
  { name: "favicon.png", size: 48, bg: FIRE, fg: CREAM, alpha: 255 },
];

for (const t of targets) {
  const png = encodePng(t.size, (x, y, size) => letterF(x, y, size, t.fg, t.bg, t.alpha));
  writeFileSync(join(outDir, t.name), png);
  process.stdout.write(`wrote ${t.name} (${t.size}x${t.size})\n`);
}
