// The World Today — Wednesday 25 November 2026.
// A program that draws one newspaper front page summing up the day's
// world news and writes it to /output/entry.png as a 1024x1024 PNG.
// Node 22, standard library only. No network. Deterministic output.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- font
// A small 5x7 pixel font, drawn from scratch for this page. Each glyph
// is 7 rows of 5 cells; "#" is ink, "." is empty. All page text is set
// in capitals, so only capitals, digits and punctuation are needed.
type Glyph = string[];

const FONT: Record<string, Glyph> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "%": ["##..#", "##.#.", "...#.", "..#..", ".#...", "#.##.", "#..##"],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", ".###.", "..#..", "..#..", "....."],
  "=": [".....", ".....", ".###.", ".....", ".###.", ".....", "....."],
};

const BLANK: Glyph = [".....", ".....", ".....", ".....", ".....", ".....", "....."];

// ------------------------------------------------------------ canvas
type RGB = [number, number, number];

const PAPER: RGB = [246, 241, 227];
const INK: RGB = [17, 17, 17];
const RED: RGB = [179, 32, 44];
const NAVY: RGB = [28, 47, 87];
const BLUE: RGB = [43, 94, 167];
const SKY: RGB = [196, 222, 240];
const GOLD: RGB = [232, 163, 23];
const WHITE: RGB = [255, 255, 255];
const GREY: RGB = [120, 116, 104];
const LIGHT: RGB = [232, 226, 210];
const DARKNAVY: RGB = [13, 21, 38];
const GREEN: RGB = [46, 125, 72];

const img = Buffer.alloc(W * H * 4);

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
  img[i + 3] = 255;
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) px(i, j, c);
  }
}

function hline(x: number, y: number, w: number, c: RGB, t = 1): void {
  rect(x, y, w, t, c);
}

function vline(x: number, y: number, h: number, c: RGB, t = 1): void {
  rect(x, y, t, h, c);
}

// Bresenham line, with a square brush of the given width.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB, w = 1): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    rect(x - Math.floor(w / 2), y - Math.floor(w / 2), w, w, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function circle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -half; x <= half; x++) px(cx + x, cy + y, c);
  }
}

// Filled triangle by scanline interpolation.
function triangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: Array<[number, number, number, number]> = [
      [x0, y0, x1, y1],
      [x1, y1, x2, y2],
      [x2, y2, x0, y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    if (xs.length >= 2) {
      const a = Math.min(...xs);
      const b = Math.max(...xs);
      for (let x = Math.ceil(a); x <= Math.floor(b); x++) px(x, y, c);
    }
  }
}

// ------------------------------------------------------------ text
function textWidth(text: string, scale: number): number {
  const t = text.toUpperCase();
  if (t.length === 0) return 0;
  return t.length * 6 * scale - scale;
}

function drawText(x: number, y: number, scale: number, c: RGB, text: string): void {
  const t = text.toUpperCase();
  let cx = x;
  for (const ch of t) {
    const g = FONT[ch] ?? BLANK;
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "#") {
          rect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentred(cx: number, y: number, scale: number, c: RGB, text: string): void {
  drawText(cx - Math.floor(textWidth(text, scale) / 2), y, scale, c, text);
}

// Greedy word wrap to a pixel width.
function wrap(text: string, maxW: number, scale: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, scale) <= maxW) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawPara(x: number, y: number, maxW: number, scale: number, gap: number, c: RGB, text: string): number {
  const lines = wrap(text, maxW, scale);
  const lh = 7 * scale + gap;
  lines.forEach((ln, i) => drawText(x, y + i * lh, scale, c, ln));
  return y + lines.length * lh;
}

// ------------------------------------------------------------ PNG
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0;
    img.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ the page
function drawPage(): void {
  rect(0, 0, W, H, PAPER);

  // Masthead.
  drawTextCentred(512, 26, 9, INK, "THE WORLD TODAY");
  hline(36, 102, 952, INK, 4);
  drawTextCentred(512, 114, 4, RED, "WEDNESDAY 25 NOVEMBER 2026");
  hline(36, 150, 952, INK, 2);

  // ---- Lead story: the CIA / ODNI breach. Art panel on the left.
  const artX = 36;
  const artY = 166;
  const artW = 300;
  const artH = 168;
  rect(artX, artY, artW, artH, NAVY);
  // A monitor screen with the agency initials.
  rect(artX + 24, artY + 22, 252, 96, DARKNAVY);
  hline(artX + 24, artY + 22, 252, GOLD, 4);
  drawTextCentred(artX + 150, artY + 30, 6, WHITE, "CIA");
  // Warning triangle with an exclamation mark, labels to its right.
  triangle(artX + 40, artY + 108, artX + 58, artY + 78, artX + 76, artY + 108, GOLD);
  drawText(artX + 52, artY + 88, 2, INK, "!");
  drawText(artX + 88, artY + 82, 2, WHITE, "UNCLASSIFIED");
  drawText(artX + 88, artY + 100, 2, WHITE, "SYSTEM BREACHED");
  // Red BREACH strip along the bottom of the panel.
  rect(artX, artY + artH - 30, artW, 30, RED);
  drawTextCentred(artX + 150, artY + artH - 24, 3, WHITE, "BREACH");

  // Lead kicker and headline, right of the art.
  drawText(360, 170, 3, RED, "WASHINGTON - CYBER ATTACK");
  drawText(360, 204, 5, INK, "CIA AND SPY CHIEF'S");
  drawText(360, 247, 5, INK, "OFFICE HIT BY HACK");
  drawText(360, 290, 3, GREY, "NO CLASSIFIED DATA TAKEN");

  // Lead body, full width.
  drawPara(
    36,
    352,
    952,
    3,
    6,
    INK,
    "Hackers broke into an unclassified open-source intelligence system used by the CIA and the Office of the Director of National Intelligence. No classified data was hit. Early signs point to China, but it is not clear if its government was involved."
  );

  hline(36, 494, 952, INK, 2);

  // ---- Middle row: three stories.
  const colW = 304;
  const colXs = [36, 360, 684];
  const midY = 510;

  // Column 1: Riyadh tower strike.
  {
    const x = colXs[0];
    rect(x, midY, colW, 92, SKY);
    // The tower: a tall dark slab with a lattice, scarred near the top.
    rect(x + 118, midY + 8, 68, 84, NAVY);
    for (let i = 0; i < 5; i++) {
      line(x + 118, midY + 18 + i * 14, x + 186, midY + 8 + i * 14, BLUE, 2);
    }
    circle(x + 152, midY + 26, 12, RED);
    circle(x + 152, midY + 26, 6, GOLD);
    // Smoke puffs.
    circle(x + 196, midY + 16, 7, GREY);
    circle(x + 208, midY + 10, 5, GREY);
    drawText(x, midY + 104, 2, RED, "MIDDLE EAST");
    drawText(x, midY + 128, 3, INK, "RIYADH TOWER");
    drawText(x, midY + 155, 3, INK, "HIT AGAIN");
    drawPara(
      x,
      midY + 186,
      colW,
      2,
      4,
      INK,
      "A Houthi drone struck the Saudi capital's tallest tower, wounding 11 people. It is the second strike on the PIF tower in under a week."
    );
  }

  // Column 2: Asian markets slide.
  {
    const x = colXs[1];
    rect(x, midY, colW, 92, WHITE);
    hline(x, midY + 91, colW, INK, 2);
    vline(x, midY, 92, INK, 2);
    // A falling market line with a red arrowhead.
    line(x + 16, midY + 18, x + 90, midY + 30, RED, 4);
    line(x + 90, midY + 30, x + 170, midY + 26, RED, 4);
    line(x + 170, midY + 26, x + 250, midY + 62, RED, 4);
    triangle(x + 250, midY + 62, x + 268, midY + 66, x + 252, midY + 80, RED);
    drawText(x + 16, midY + 68, 2, RED, "SEOUL -5.3%");
    drawText(x, midY + 104, 2, RED, "MARKETS");
    drawText(x, midY + 128, 3, INK, "MARKETS SLIDE");
    drawText(x, midY + 155, 3, INK, "ON TARIFF FEARS");
    drawPara(
      x,
      midY + 186,
      colW,
      2,
      4,
      INK,
      "Shares fell across Asia as fresh US tariff threats hit sentiment. Seoul fell 5.3%, Taiwan 5.1% and Tokyo 2.9%."
    );
  }

  // Column 3: Ukraine ship strike.
  {
    const x = colXs[2];
    rect(x, midY, colW, 92, SKY);
    // Sea and a cargo ship.
    rect(x, midY + 58, colW, 34, BLUE);
    rect(x + 70, midY + 30, 150, 28, INK);
    rect(x + 90, midY + 14, 40, 16, RED);
    rect(x + 140, midY + 14, 40, 16, GOLD);
    rect(x + 190, midY + 14, 24, 16, WHITE);
    // Drone dots above the ship.
    circle(x + 250, midY + 12, 4, RED);
    circle(x + 232, midY + 20, 3, RED);
    circle(x + 214, midY + 28, 3, RED);
    drawText(x, midY + 104, 2, RED, "UKRAINE WAR");
    drawText(x, midY + 128, 3, INK, "KYIV ADMITS");
    drawText(x, midY + 155, 3, INK, "SHIP STRIKE");
    drawPara(
      x,
      midY + 186,
      colW,
      2,
      4,
      INK,
      "President Zelenskiy confirmed Ukraine hit a Russian cargo ship in the Gulf of Finland. Moscow called the attacks 'terrorism'."
    );
  }

  hline(36, 806, 952, INK, 2);

  // ---- Bottom row: Congo, and Also Today.
  drawText(36, 822, 2, RED, "AFRICA - HEALTH");
  drawText(36, 848, 3, INK, "EBOLA TEAMS FLEE FIGHTING");
  drawPara(
    36,
    876,
    560,
    2,
    4,
    INK,
    "The WHO evacuated health workers from a hospital in Ituri, DR Congo, after three days sheltering from fierce fighting at the heart of the Ebola outbreak."
  );

  // Divider between the two bottom panels.
  vline(624, 822, 128, INK, 2);

  drawText(648, 822, 3, INK, "ALSO TODAY");
  hline(648, 850, 340, RED, 3);
  drawPara(
    648,
    860,
    340,
    2,
    4,
    INK,
    "Giuliani gets the Medal of Freedom. Huawei guilty on 10 of 12 counts, including stealing trade secrets. Turkeys Freedom and Feathers spared for Thanksgiving."
  );

  // Footer.
  hline(36, 978, 952, INK, 2);
  drawTextCentred(512, 988, 2, GREY, "THE WORLD TODAY - ONE DAY, ONE IMAGE");
}

// ------------------------------------------------------------ main
function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  fs.mkdirSync(outDir, { recursive: true });
  drawPage();
  const png = encodePng();
  fs.writeFileSync(path.join(outDir, "entry.png"), png);
}

main();
