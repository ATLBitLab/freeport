import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const width = 1200;
const height = 900;
const data = Buffer.alloc((width * 4 + 1) * height);

function oklchApprox(x, y) {
  const dx = x - width * 0.7;
  const dy = y - height * 0.25;
  const d = Math.sqrt(dx * dx + dy * dy) / Math.max(width, height);
  return [
    Math.round(238 - d * 70 + Math.sin(y / 34) * 5),
    Math.round(235 - d * 42 + Math.cos(x / 51) * 3),
    Math.round(218 - d * 58),
  ];
}

function setPixel(row, col, r, g, b, a = 255) {
  const offset = row * (width * 4 + 1) + 1 + col * 4;
  data[offset] = Math.max(0, Math.min(255, r));
  data[offset + 1] = Math.max(0, Math.min(255, g));
  data[offset + 2] = Math.max(0, Math.min(255, b));
  data[offset + 3] = a;
}

function blendPixel(row, col, r, g, b, alpha = 0.8) {
  if (row < 0 || row >= height || col < 0 || col >= width) return;
  const offset = row * (width * 4 + 1) + 1 + col * 4;
  data[offset] = Math.round(data[offset] * (1 - alpha) + r * alpha);
  data[offset + 1] = Math.round(data[offset + 1] * (1 - alpha) + g * alpha);
  data[offset + 2] = Math.round(data[offset + 2] * (1 - alpha) + b * alpha);
}

function rect(x, y, w, h, color, alpha = 1) {
  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) {
      blendPixel(row, col, color[0], color[1], color[2], alpha);
    }
  }
}

function line(x0, y0, x1, y1, color, alpha = 0.7) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    for (let yy = -1; yy <= 1; yy += 1) {
      for (let xx = -1; xx <= 1; xx += 1) {
        blendPixel(y + yy, x + xx, color[0], color[1], color[2], alpha);
      }
    }
  }
}

for (let y = 0; y < height; y += 1) {
  data[y * (width * 4 + 1)] = 0;
  for (let x = 0; x < width; x += 1) {
    const [r, g, b] = oklchApprox(x, y);
    const grid = x % 42 === 0 || y % 42 === 0 ? -18 : 0;
    setPixel(y, x, r + grid, g + grid, b + grid);
  }
}

const nodes = [
  [164, 178, 96, 55],
  [418, 134, 164, 84],
  [782, 188, 144, 73],
  [986, 316, 112, 62],
  [662, 426, 190, 92],
  [278, 468, 150, 82],
  [500, 694, 168, 82],
  [902, 678, 142, 76],
];

for (let i = 0; i < nodes.length - 1; i += 1) {
  const [x0, y0, w0, h0] = nodes[i];
  const [x1, y1, w1, h1] = nodes[i + 1];
  line(x0 + w0 / 2, y0 + h0 / 2, x1 + w1 / 2, y1 + h1 / 2, [55, 104, 73], 0.33);
}

nodes.forEach(([x, y, w, h], index) => {
  rect(x + 10, y + 12, w, h, [65, 74, 62], 0.12);
  rect(x, y, w, h, [246, 244, 232], 0.9);
  rect(x, y, w, 6, index % 3 === 0 ? [59, 145, 92] : index % 3 === 1 ? [191, 129, 43] : [72, 95, 132], 0.95);
  rect(x + 18, y + 22, Math.floor(w * 0.66), 8, [47, 63, 51], 0.78);
  rect(x + 18, y + 42, Math.floor(w * 0.45), 5, [112, 129, 104], 0.7);
  rect(x + 18, y + 54, Math.floor(w * 0.55), 5, [112, 129, 104], 0.55);
});

rect(72, 742, 328, 68, [36, 50, 41], 0.92);
rect(96, 766, 210, 10, [224, 219, 188], 0.95);
rect(96, 786, 132, 7, [121, 183, 123], 0.95);
rect(774, 64, 260, 42, [36, 50, 41], 0.92);
rect(796, 80, 170, 7, [224, 219, 188], 0.95);

const signature = Buffer.from("Freeport signed work market");
for (let i = 0; i < signature.length; i += 1) {
  const x = 802 + i * 8;
  const y = 92 + (signature[i] % 4);
  rect(x, y, 5, 2, [121, 183, 123], 0.9);
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, payload) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(payload.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, payload])));
  return Buffer.concat([length, typeBuffer, payload, crc]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0);
header.writeUInt32BE(height, 4);
header[8] = 8;
header[9] = 6;
header[10] = 0;
header[11] = 0;
header[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(data)),
  chunk("IEND", Buffer.alloc(0)),
]);

writeFileSync("public/assets/freeport-board.png", png);
