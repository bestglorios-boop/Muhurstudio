/** Turkce karakter sayacini uzerinden gecer, tek tek yazmaz. */
import { readFileSync } from "node:fs";
const CP1252_HIGH = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};
for (const f of process.argv.slice(2)) {
  const buf = readFileSync(f);
  // Diskteki baytlari CP1252 olarak oku -> dogru Turkce metni elde et.
  let s = "";
  for (const b of buf) {
    s += (b >= 0x80 && b <= 0x9f) ? String.fromCharCode(CP1252_HIGH[b]) : String.fromCharCode(b);
  }
  const turkish = (s.match(/[çğıöşüÇĞİÖŞÜâî]/g) || []).length;
  const bad = (s.match(/[ÃÄÅÂÇ–]/g) || []).length;
  console.log(`${f}: turkce=${turkish}  mojibake=${bad}`);
}



// Windows-1252 -> Unicode eslemesi (0x80-0x9F araligi Latin-1'den farklidir).
const CP1252_HIGH = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};

function cp1252ToUnicode(byte) {
  if (byte >= 0x80 && byte <= 0x9f) return String.fromCharCode(CP1252_HIGH[byte]);
  return String.fromCharCode(byte);
}

/** Turkce harfleri byte byte geri cevirir; ASCII ve kod noktasi degismez. */
function decode(buf) {
  let out = "";
  for (const b of buf) out += cp1252ToUnicode(b);
  return out;
}

/** Tersi: Unicode -> Windows-1252 baytlari. Tanimsiz karakterler '?' olur. */
function encode(str) {
  const bytes = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp <= 0x7f) { bytes.push(cp); continue; }
    const inv = Object.entries(CP1252_HIGH).find(([, u]) => u === cp);
    if (inv) { bytes.push(Number(inv[0])); continue; }
    if (cp <= 0xff) { bytes.push(cp); continue; }
    // Turkce harfler Latin-1 araliginda; ek kod noktalari CP1252'de yok.
    bytes.push(0x3f);
  }
  return Buffer.from(bytes);
}

const files = process.argv.slice(2);
for (const f of files) {
  const original = readFileSync(f);              // diskteki GERCEK baytlar
  const decoded = decode(original);
  writeFileSync(f, encode(decoded));             // ayni bayt duzeni, yeni yazim
  console.log(`ONARILDI: ${f}`);
}
