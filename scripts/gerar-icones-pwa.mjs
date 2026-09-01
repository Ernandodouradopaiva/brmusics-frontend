import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GREEN = [0x31, 0x70, 0x42, 0xff];
const WHITE = [0xff, 0xff, 0xff, 0xff];

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const dest = y * (width * 4 + 1);
    raw[dest] = 0;
    rgba.copy(raw, dest + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function setPx(data, w, x, y, color) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= w || yi >= w) return;
  const i = (yi * w + xi) * 4;
  data[i] = color[0];
  data[i + 1] = color[1];
  data[i + 2] = color[2];
  data[i + 3] = color[3];
}

function fillCircle(data, w, cx, cy, r, color) {
  const r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(w - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) setPx(data, w, x, y, color);
    }
  }
}

function fillEllipse(data, w, cx, cy, rx, ry, rot, color) {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const bound = Math.ceil(Math.max(rx, ry) + 1);
  const x0 = Math.max(0, Math.floor(cx - bound));
  const x1 = Math.min(w - 1, Math.ceil(cx + bound));
  const y0 = Math.max(0, Math.floor(cy - bound));
  const y1 = Math.min(w - 1, Math.ceil(cy + bound));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const lx = (dx * cos + dy * sin) / rx;
      const ly = (-dx * sin + dy * cos) / ry;
      if (lx * lx + ly * ly <= 1) setPx(data, w, x, y, color);
    }
  }
}

function fillRect(data, w, x0, y0, x1, y1, color) {
  const xa = Math.max(0, Math.floor(Math.min(x0, x1)));
  const xb = Math.min(w - 1, Math.ceil(Math.max(x0, x1)));
  const ya = Math.max(0, Math.floor(Math.min(y0, y1)));
  const yb = Math.min(w - 1, Math.ceil(Math.max(y0, y1)));
  for (let y = ya; y <= yb; y++) {
    for (let x = xa; x <= xb; x++) {
      setPx(data, w, x, y, color);
    }
  }
}

function roundedMask(x, y, s, radius) {
  const r = Math.min(radius, s / 2);
  if (x >= r && x < s - r) return true;
  if (y >= r && y < s - r) return true;
  const cx = x < r ? r : s - r;
  const cy = y < r ? r : s - r;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  return dx * dx + dy * dy <= r * r;
}

function drawNote(data, s) {
  const cx = s * 0.5;
  const cy = s * 0.52;
  const headRx = s * 0.13;
  const headRy = s * 0.09;
  const headCx = cx - s * 0.06;
  const headCy = cy + s * 0.12;
  fillEllipse(data, s, headCx, headCy, headRx, headRy, -0.45, WHITE);

  const stemX0 = headCx + headRx * 0.62;
  const stemX1 = stemX0 + s * 0.045;
  const stemTop = cy - s * 0.22;
  fillRect(data, s, stemX0, stemTop, stemX1, headCy - headRy * 0.15, WHITE);

  const flagCx = stemX1 + s * 0.02;
  const flagCy = stemTop + s * 0.09;
  fillEllipse(data, s, flagCx + s * 0.07, flagCy, s * 0.1, s * 0.055, 0.35, WHITE);
  fillRect(data, s, stemX0, stemTop, stemX1 + s * 0.02, stemTop + s * 0.045, WHITE);
}

function renderIcon(size, { rounded }) {
  const data = Buffer.alloc(size * size * 4);
  const radius = rounded ? size * 0.22 : 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inside = radius === 0 ? true : roundedMask(x, y, size, radius);
      if (inside) setPx(data, size, x, y, GREEN);
    }
  }
  drawNote(data, size);
  return encodePng(size, size, data);
}

function encodeIco(png32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png32.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png32]);
}

function write(rel, buf) {
  const dest = join(ROOT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
}

const icon192 = renderIcon(192, { rounded: true });
const icon512 = renderIcon(512, { rounded: true });
const iconMaskable = renderIcon(512, { rounded: false });
const apple = renderIcon(180, { rounded: false });
const fav32 = renderIcon(32, { rounded: true });

write('public/icons/icon-192.png', icon192);
write('public/icons/icon-512.png', icon512);
write('public/icons/icon-512-maskable.png', iconMaskable);
write('public/apple-touch-icon.png', apple);
write('public/favicon.ico', encodeIco(fav32));
