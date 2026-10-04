/**
 * strings-qa.mjs — §24 / §26 İPLİK (siyah çizgi) arka planı QA.
 *
 *   node scripts/strings-qa.mjs [port]
 *
 * Her genişlikte:
 *   1) yatay taşma var mı (scrollbar üretmemeli)
 *   2) `.on-paper::before` gerçekten iki katmanlı data-URI mi
 *   3) metin katmanı ipliğin ÜSTÜNDE mi (elementFromPoint)
 *   4) tıklama ipliğe kaptırılmamalı (pointer-events)
 *   5) KOYU bölümlerde iplik YOK (yalnızca kâğıt)
 *   6) Yoğunluk — SVG tuvale çizilip saydam olmayan piksel oranı ölçülür
 */
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const PORT = process.argv[2] || "3000";
const BASE = `http://localhost:${PORT}`;

const VIEWPORTS = [
  [320, 568], [360, 800], [375, 667], [390, 844], [414, 896], [430, 932],
  [480, 960], [600, 900], [768, 1024], [820, 1180], [900, 1200],
  [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1536, 864],
  [1600, 900], [1920, 1080], [2560, 1440], [3840, 2160],
  [844, 390], [740, 360],
];

function findChrome() {
  const c = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].find((p) => existsSync(p));
  if (!c) throw new Error("Chrome/Edge bulunamadi");
  return c;
}

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});

let issues = 0;
const add = (s) => {
  issues++;
  console.log("  ! " + s);
};

/** İplik yoğunluğunu SVG'yi tuvale çizerek ölçer (%). */
async function measureDensity() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
  const out = await page.evaluate(async () => {
    const el = document.querySelector(".on-paper");
    if (!el) return null;
    const bg = getComputedStyle(el, "::before").backgroundImage;
    // `[^"]+` gerekli: grain veri-URIsi `url(%23p)` gibi iç içe `)`
    // içerir; `)` ile kesen regex URI'yi kırpardı.
    const urls = [...bg.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
    const res = [];
    for (const u of urls) {
      if (!u.startsWith("data:")) continue;
      const img = new Image();
      img.src = u;
      try {
        await img.decode();
      } catch {
        res.push({ err: "decode" });
        continue;
      }
      // ÖLÇÜM YEREL ÇÖZÜNÜRLÜKTE: 400px'e ölçeklersen 1.6px'lik iplik
      // ~0.4px'e düşer ve alfa eşiğin altına iner → yanlış "0%" okunurdu.
      const W = Math.min(1600, img.width);
      const H = Math.min(1000, img.height);
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const cx = cv.getContext("2d");
      cx.drawImage(img, 0, 0, W, H);
      const d = cx.getImageData(0, 0, W, H).data;
      let ink = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) ink++;
      res.push({
        inkPct: +((ink / (W * H)) * 100).toFixed(3),
        isStrings: u.includes("stroke"),
        size: `${img.width}x${img.height}`,
      });
    }
    return res;
  });
  await page.close();
  return out;
}


console.log("=== IPTIK YOGLULUK OLCECI ===");
const density = await measureDensity();
if (!density) {
  add(".on-paper bulunamadi");
} else {
  for (const d of density) {
    if (d.err) {
      add("iplik SVG'si cozulemedi: " + d.err);
      continue;
    }
    const kind = d.isStrings ? "iplik" : "grain ";
    console.log(`  ${kind}  ${d.size.padEnd(10)}  ink=${d.inkPct}%`);
    if (d.isStrings) {
      if (d.inkPct > 3) add(`iplik YOGUN: ${d.inkPct}% (> %3 → görsel gürültü)`);
      if (d.inkPct < 0.05) add(`iplik COK SOLUK: ${d.inkPct}% (neredeyse görünmez)`);
    }
  }
}

console.log("\n=== GENISLIK TARAMASI ===");
for (const [w, h] of VIEWPORTS) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.setViewport({
    width: w,
    height: h,
    deviceScaleFactor: 1,
    isMobile: w < 768,
    hasTouch: w < 1024,
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 500));

  const r = await page.evaluate(() => {
    const out = {};
    const de = document.documentElement;
    out.overflowX = de.scrollWidth - de.clientWidth;
    out.vw = innerWidth;

    const secs = [...document.querySelectorAll(".on-paper")];
    out.sections = secs.length;
    out.strings = 0;
    out.textAbove = true;
    out.leak = false;
    out.darkHasStrings = false;

    for (const s of secs) {
      const bg = getComputedStyle(s, "::before").backgroundImage;
      if (bg.includes("stroke")) out.strings++;
    }

    // Metin katmanı ipliğin üstünde mi?
    for (const s of secs) {
      const t = s.querySelector("p, h1, h2, h3, li");
      if (!t) continue;
      const b = t.getBoundingClientRect();
      if (b.width < 4 || b.height < 4) continue;
      const hit = document.elementFromPoint(
        b.left + Math.min(20, b.width / 2),
        b.top + Math.min(8, b.height / 2),
      );
      if (hit && !(s === hit || s.contains(hit))) out.leak = true;
      if (hit && (s === hit || s.contains(hit)) && !t.contains(hit) && hit !== t) {
        // bölümün kendisine düşüyorsa metin EN ÜSTTE değil demektir
        if (hit === s) out.textAbove = false;
      }
    }

    // Koyu bölümlere iplik sızmış mı?
    const dark = [...document.querySelectorAll("section:not(.on-paper)")];
    for (const d of dark) {
      const bg = getComputedStyle(d, "::before").backgroundImage;
      if (bg.includes("stroke")) out.darkHasStrings = true;
    }
    return out;
  });

  const tag = `${w}x${h}`;
  if (r.overflowX > 0) add(`${tag}: yatay tasma ${r.overflowX}px`);
  if (r.sections === 0) add(`${tag}: .on-paper bolumu yok`);
  else if (r.strings !== r.sections)
    add(`${tag}: iplik her kagit bolumunde yok (${r.strings}/${r.sections})`);
  if (!r.textAbove) add(`${tag}: metin ipligin ALTINDA`);
  if (r.leak) add(`${tag}: iplik metin katmanini asti`);
  if (r.darkHasStrings) add(`${tag}: KOYU bolume iplik sızdı`);
  if (errors.length) add(`${tag}: konsol hatasi → ${errors[0]}`);

  if (r.overflowX <= 0 && r.sections > 0 && r.strings === r.sections && r.textAbove && !r.leak && !r.darkHasStrings && !errors.length) {
    console.log(
      `  ok ${tag.padEnd(10)} bolum=${r.sections} iplik=${r.strings} tasma=0`,
    );
  }
  await page.close();
}

await browser.close();
console.log(`\nTOPLAM SORUN: ${issues}`);
process.exit(issues > 0 ? 1 : 0);
