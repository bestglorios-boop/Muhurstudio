/**
 * Nötr "arşiv plakaları" üretir.
 * Bunlar proje ekran görüntüsü DEĞİLDİR. Gerçek görsel olmayan projeler için
 * kasıtlı olarak soyut, marka diliyle uyumlu yedeklerdir.
 *
 * Kullanım: node scripts/make-plates.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const INK = "#080808";
const LINE = "#242424";
const MID = "#2E2E2E";
const LIGHT = "#F5F2ED";
const MUTED = "#6E6862";
const SEAL = "#C23B22";

const SIZES = {
  "16/9": [1600, 900],
  "3/2": [1500, 1000],
  "4/5": [1000, 1250],
  "1/1": [1200, 1200],
  "21/9": [2100, 900],
};

const L = (x1, y1, x2, y2, c = LINE) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1"/>`;

function contour(w, h) {
  const out = [];
  for (let i = 0; i < 26; i++) {
    const r = 26 + i * 21;
    out.push(
      `<ellipse cx="${w * 0.5}" cy="${h * 0.48}" rx="${r}" ry="${r * 0.78}" fill="none" stroke="${i % 6 === 0 ? MID : LINE}" stroke-width="1"/>`
    );
  }
  return out.join("");
}

function rules(w, h) {
  const out = [];
  let x = w * 0.08;
  let i = 0;
  while (x < w * 0.92) {
    out.push(L(x, h * 0.12, x, h * 0.88, i % 7 === 3 ? MID : LINE));
    x += 14 + ((i * 37) % 5) * 9;
    i++;
  }
  return out.join("");
}

function measure(w, h) {
  const out = [];
  for (let i = 0; i < 9; i++) {
    const y = h * 0.2 + i * (h * 0.075);
    const long = i % 3 === 0;
    out.push(L(long ? 0 : w * 0.18, y, long ? w : w * 0.82, y));
  }
  return out.join("");
}

function ticks(w, h) {
  const out = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      const x = w * 0.14 + (c * (w * 0.72)) / 6;
      const y = h * 0.2 + (r * (h * 0.6)) / 4;
      const col = c === 3 && r === 2 ? SEAL : MID;
      out.push(L(x - 7, y, x + 7, y, col), L(x, y - 7, x, y + 7, col));
    }
  }
  return out.join("");
}

function hatch(w, h) {
  const out = [];
  for (let i = -h; i < w; i += 16) out.push(L(i, h, i + h, 0));
  return `<g opacity="0.85">${out.join("")}</g>`;
}

function arc(w, h) {
  return [
    `<path d="M ${w * 0.04} ${h * 0.72} Q ${w * 0.5} ${h * 0.06} ${w * 0.96} ${h * 0.72}" fill="none" stroke="${MID}" stroke-width="1"/>`,
    `<path d="M ${w * 0.12} ${h * 0.78} Q ${w * 0.5} ${h * 0.2} ${w * 0.88} ${h * 0.78}" fill="none" stroke="${LINE}" stroke-width="1"/>`,
    L(0, h * 0.88, w, h * 0.88, MID),
    L(0, h * 0.93, w, h * 0.93),
  ].join("");
}

function columns(w, h) {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const x = w * 0.1 + i * (w * 0.2);
    out.push(L(x, h * (0.22 + (i % 3) * 0.06), x, h * 0.82, i === 2 ? MID : LINE));
  }
  for (let i = 0; i < 9; i++) {
    const y = h * 0.24 + i * (h * 0.07);
    out.push(L(w * 0.1, y, w * 0.1 + w * 0.8 * (0.3 + ((i * 13) % 7) / 10), y));
  }
  return out.join("");
}

function typeGlyph(w, h, glyph) {
  const size = h * 1.55;
  return [
    `<text x="${w * 0.5}" y="${h * 0.5 + size * 0.34}" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" fill="none" stroke="${MID}" stroke-width="2" text-anchor="middle" letter-spacing="-0.03em">${glyph}</text>`,
    L(w * 0.08, h * 0.16, w * 0.08, h * 0.16 + 34, SEAL),
  ].join("");
}


const KINDS = { contour, rules, measure, ticks, hatch, arc, columns, typeGlyph };

function plate({ kind, glyph, index, title, w, h }) {
  const ls = Math.max(11, Math.round(w / 78));
  const ts = Math.max(20, Math.round(w / 26));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
<rect width="${w}" height="${h}" fill="${INK}"/>
${KINDS[kind](w, h, glyph || "M")}
<g opacity="0.92">
<text x="${w * 0.06}" y="${h * 0.09}" font-family="Helvetica, Arial, sans-serif" font-size="${ls}" letter-spacing="${(ls * 0.16).toFixed(1)}" fill="${MUTED}">${index} — KONSEPT ÇALIŞMA</text>
<text x="${w * 0.06}" y="${h * 0.935}" font-family="Georgia, 'Times New Roman', serif" font-size="${ts}" fill="${LIGHT}" letter-spacing="-0.01em">${title}</text>
<text x="${w * 0.06}" y="${h * 0.935 + ls * 2.4}" font-family="Helvetica, Arial, sans-serif" font-size="${ls}" letter-spacing="${(ls * 0.1).toFixed(1)}" fill="${MUTED}">MÜHÜR STUDIO — ARŞİV PLAKASI</text>
</g>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${LINE}" stroke-width="1"/>
</svg>`;
}

const defs = [
  ["notella", "kapak", { kind: "contour", ratio: "3/2", index: "01", title: "Notella" }],
  ["notella", "kapak-2", { kind: "rules", ratio: "4/5", index: "01", title: "Notella" }],
  ["bursa-sofrasi", "kapak", { kind: "hatch", ratio: "16/9", index: "02", title: "Bursa Sofrası" }],
  ["bursa-sofrasi", "kapak-2", { kind: "columns", ratio: "4/5", index: "02", title: "Bursa Sofrası" }],
];

for (const [slug, name, cfg] of defs) {
  const [w, h] = SIZES[cfg.ratio];
  const file = resolve(`public/projects/${slug}/${name}.svg`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, plate({ ...cfg, w, h }), "utf8");
  console.log("yazildi:", file);
}
