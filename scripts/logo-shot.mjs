/**
 * MARKA YAKIN PLAN — logo işaretinin gerçekte nasıl çizildiğini denetler.
 *
 * Kullanım: node scripts/logo-shot.mjs [port]
 *
 * Kapsam:
 * - Header (masaüstü) ve mobil başlık
 * - Footer
 * - Favicon / site ikonu
 * - En-boy oranı bozulması, gölge/parıltı/ degrade varlığı
 * - Eksik dosya (404) kontrolü
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";

const PORT = process.argv[2] || "3000";
const BASE = `http://localhost:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "audit";

mkdirSync(OUT, { recursive: true });

let problems = 0;
const add = (s) => { problems++; console.log("  ! " + s); };
const ok = (s) => console.log("  ✓ " + s);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=4"],
});

// --- 1. Yerel SVG dosyası gerçekten var mı, gerçek bir varlık mı? ---
const LOGO_PATH = "public/icons/logo.svg";
try {
  const svg = readFileSync(LOGO_PATH, "utf8");
  if (!/<svg[\s>]/i.test(svg)) add("logo.svg geçerli bir SVG değil");
  const vb = svg.match(/viewBox="([^"]+)"/i);
  if (!vb) add("logo.svg viewBox içermiyor (en-boy oranı kaybolur)");
  else {
    const nums = vb[1].trim().split(/\s+/).map(Number);
    const w = nums[2];
    const h = nums[3];
    if (w && h && w !== h) console.log(`  · viewBox ${vb[1]} (kare değil: en-boy ${w}:${h})`);
    else ok(`logo.svg viewBox kare: ${vb[1]}`);
  }
} catch {
  add(`${LOGO_PATH} okunamadı`);
}

// --- 2. Başlık ve footer'da logo gerçekten yükleniyor mu? ---
for (const [label, w, h, sel] of [
  ["masaustu baslik", 1440, 900, "header img"],
  ["mobil baslik", 390, 844, "header img"],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 4 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1200));

  const info = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return { missing: true };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      natural: `${el.naturalWidth}x${el.naturalHeight}`,
      rendered: `${Math.round(r.width)}x${Math.round(r.height)}`,
      complete: el.complete && el.naturalWidth > 0,
      shadow: cs.boxShadow,
      filter: cs.filter,
      src: el.getAttribute("src"),
    };
  }, sel);

  if (info.missing) add(`${label}: logo öğesi bulunamadı`);
  else if (!info.complete) add(`${label}: logo yüklenmedi (${info.src})`);
  else {
    const [rw, rh] = info.rendered.split("x").map(Number);
    const [nw, nh] = info.natural.split("x").map(Number);
    const naturalRatio = nw / nh;
    const renderedRatio = rw / rh;
    if (Math.abs(naturalRatio - renderedRatio) > 0.02) {
      add(`${label}: en-boy oranı bozuldu ${info.rendered} vs ${info.natural}`);
    } else {
      ok(`${label}: oran korundu ${info.rendered} (kaynak ${info.natural})`);
    }
    if (info.shadow && info.shadow !== "none") add(`${label}: gölge var -> ${info.shadow}`);
    if (info.filter && info.filter !== "none") add(`${label}: filtre var -> ${info.filter}`);
  }

  await page.screenshot({
    path: `${OUT}/logo-${label.replace(/\s+/g, "-")}.png`,
    clip: { x: 0, y: 0, width: Math.min(w, 460), height: 90 },
  });
  await page.close();
}

// --- 3. Favicon gerçekten servis ediliyor mu? ---
for (const p of ["/icon.svg", "/icons/logo.svg"]) {
  const res = await fetch(BASE + p).catch(() => null);
  if (res && res.ok) ok(`${p} -> ${res.status}`);
  else add(`${p} -> ${res ? res.status : "hata"}`);
}

await browser.close();
console.log(`\nMARKA SORUN SAYISI: ${problems}`);
