/**
 * level.mjs — "HER CİHAZDA DÜZ, TEMİZ VE NET" DENETİMİ
 *
 * Üç ölçüm ailesi, 20 genişlik × 5 rota:
 *   DÜZ     bölüm sol/sağ kenarları aynı hizada mı, oluk simetrik mi
 *   TEMİZ   yatay taşma, kenar dışına taşan öge, kırpılan metin, çakışma
 *   NET     başlıklar GERÇEK yazı tipinde mi (Georgia/Arial'a düşmemiş),
 *           ağırlık 400/500 tasarım değerinde mi, font yüklenmiş mi,
 *           satır kutusu taşıyor mu
 *
 * Kullanım: node scripts/level.mjs
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("level.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);

const GENISLIKLER = [320, 360, 375, 390, 414, 430, 480, 640, 768, 834, 960, 1024, 1152, 1280, 1366, 1440, 1536, 1680, 1920, 2560];
const ROTALAR = ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"];

const browser = await puppeteer.launch({
  executablePath: chrome, headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();

let sorun = 0;
const bul = (s) => { sorun++; say("  ! " + s); };

/* ---- sayfa içinde çalışan ölçüm ---- */
const OLC = () => {
  const vw = document.documentElement.clientWidth;
  const out = { vw, tasma: 0, tasan: [], kirpan: [], cakisan: [], tipografi: [] };
  out.tasma = document.documentElement.scrollWidth - vw;

  const gorunur = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || cs.opacity === "0") return null;
    if (e.closest("[aria-hidden='true']")) return null;
    return { r, cs };
  };

  for (const e of document.querySelectorAll("main *, header *, footer *, nav *")) {
    const g = gorunur(e); if (!g) continue;
    if (g.r.right > vw + 1 || g.r.left < -1) {
      out.tasan.push(`${e.tagName}.${(e.className || "").toString().slice(0, 24)} [${Math.round(g.r.left)}..${Math.round(g.r.right)}]`);
    }
    const ox = g.cs.overflowX, oy = g.cs.overflowY;
    if ((ox === "hidden" || ox === "clip" || oy === "hidden" || oy === "clip") && e.clientWidth > 0) {
      if (e.scrollWidth > e.clientWidth + 2) {
        out.kirpan.push(`${e.tagName}.${(e.className || "").toString().slice(0, 24)} ${e.scrollWidth}>${e.clientWidth}`);
      }
    }
  }

  /* metin çakışması */
  const metinler = [...document.querySelectorAll("main h1,main h2,main h3,main p,main a,footer p,footer a,footer li")]
    .map((e) => ({ e, g: gorunur(e) }))
    .filter((x) => x.g && (x.e.textContent || "").trim().length > 1);
  for (let i = 0; i < metinler.length; i++) {
    for (let j = i + 1; j < metinler.length; j++) {
      const a = metinler[i], b = metinler[j];
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const A = a.g.r, B = b.g.r;
      const gx = Math.min(A.right, B.right) - Math.max(A.left, B.left);
      const gy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (gx > 4 && gy > 6) {
        out.cakisan.push(`"${(a.e.textContent || "").trim().slice(0, 14)}" ↔ "${(b.e.textContent || "").trim().slice(0, 14)}" (${Math.round(gx)}x${Math.round(gy)})`);
      }
    }
  }

  /* bölüm kenarları */
  const bolumler = [...document.querySelectorAll("main section, main > div")].map((s) => {
    const ilk = [...s.children].find((c) => c.getBoundingClientRect().width > 0);
    if (!ilk) return null;
    const r = ilk.getBoundingClientRect();
    if (r.width < vw * 0.5) return null;
    return { sol: Math.round(r.left), sag: Math.round(vw - r.right) };
  }).filter(Boolean);
  out.bolumKenarlari = bolumler;

  /* tipografi */
  for (const e of [...document.querySelectorAll("h1,h2,h3,.label,[class*=font-display]")].slice(0, 40)) {
    const g = gorunur(e); if (!g) continue;
    out.tipografi.push({
      metin: (e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 22),
      aile: g.cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
      agirlik: g.cs.fontWeight,
      tasmaVar: e.scrollHeight > e.clientHeight + 2 && e.clientHeight > 0,
    });
  }
  out.fontDurum = document.fonts.status;
  return out;
};

say("=== GENIS TARAMA: " + GENISLIKLER.length + " genislik x " + ROTALAR.length + " rota ===");

for (const w of GENISLIKLER) {
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1, hasTouch: w < 900 });
  let wSorun = 0;
  for (const r of ROTALAR) {
    await page.goto(ORIGIN + r, { waitUntil: "load", timeout: 30000 });
    await new Promise((k) => setTimeout(k, 450));
    const o = await page.evaluate(OLC);
    const et = `${w}px ${r}`;

    if (o.tasma > 0) { wSorun++; bul(`${et}: YATAY TASMA ${o.tasma}px`); }
    if (o.tasan.length) { wSorun++; bul(`${et}: kenar disi ${o.tasan.length} -> ${o.tasan.slice(0, 2).join(" | ")}`); }
    if (o.kirpan.length) { wSorun++; bul(`${et}: KIRPILAN METIN ${o.kirpan.length} -> ${o.kirpan.slice(0, 2).join(" | ")}`); }
    if (o.cakisan.length) { wSorun++; bul(`${et}: CAKISMA ${o.cakisan.length} -> ${o.cakisan.slice(0, 2).join(" | ")}`); }

    for (const t of o.tipografi) {
      if (["Times", "Arial", "Helvetica", "Iowan Old Style"].includes(t.aile)) {
        wSorun++; bul(`${et}: DUSUK FONT "${t.metin}" -> ${t.aile}`);
      }
      if (!["400", "500"].includes(t.agirlik)) {
        wSorun++; bul(`${et}: BEKLENMEYEN AGLIKLIK ${t.agirlik} "${t.metin}"`);
      }
      if (t.tasmaVar) { wSorun++; bul(`${et}: SATIR TASIYOR "${t.metin}"`); }
    }
    if (o.fontDurum !== "loaded") { wSorun++; bul(`${et}: FONT DURUMU=${o.fontDurum}`); }
  }
  if (wSorun === 0) say(`  ok  ${String(w).padStart(4)}px  (5 rota temiz)`);
}

say("");
say("=== DETAYLI HIZA: bolum kenarlari (sol / sag) ===");
for (const w of [320, 390, 768, 1024, 1440, 2560]) {
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 700));
  const o = await page.evaluate(OLC);
  const sol = [...new Set(o.bolumKenarlari.map((b) => b.sol))];
  const sag = [...new Set(o.bolumKenarlari.map((b) => b.sag))];
  say(`  ${String(w).padStart(4)}px  sol=${JSON.stringify(sol)}  sag=${JSON.stringify(sag)}`);
  if (sol.length > 1) say(`     sol listesi: ${JSON.stringify(o.bolumKenarlari.map((b) => b.sol))}`);
}

say("");
say("=== SONUC: " + sorun + " sorun ===");
await browser.close();
process.exit(0);
