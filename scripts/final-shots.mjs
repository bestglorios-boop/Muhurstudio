/**
 * final-shots.mjs — HER CİHAZ/SİZE için görsel kanıt.
 *
 * Ölçüm sayı verdi; bu görsel kanıt. 6 gerçek kırılma noktası:
 *   320 (en dar) · 390 (iPhone) · 768 (tablet) · 1024 · 1440 · 1920
 * Her biri için: hero, tam sayfa, footer.
 *
 * Kullanım: node scripts/final-shots.mjs
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";

mkdirSync("shots/final", { recursive: true });

const ciz = (s) => console.log(s);
const chrome = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].find(existsSync);
if (!chrome) {
  ciz("HATA: Chrome yok");
  process.exit(1);
}

/* Gerçek cihaz genişlikleri + DPR ( retina ) */
const CIHAZLAR = [
  { ad: "320-en-dar", w: 320, h: 640, dpr: 2, touch: true },
  { ad: "390-iphone", w: 390, h: 844, dpr: 3, touch: true },
  { ad: "768-tablet", w: 768, h: 1024, dpr: 2, touch: true },
  { ad: "1024-ipad-yatay", w: 1024, h: 768, dpr: 2, touch: true },
  { ad: "1440-masaustu", w: 1440, h: 900, dpr: 2, touch: false },
  { ad: "1920-genis", w: 1920, h: 1080, dpr: 1, touch: false },
];

const ROTALAR = ["/", "/work", "/work/notella", "/about"];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();

for (const c of CIHAZLAR) {
  await page.setViewport({
    width: c.w,
    height: c.h,
    deviceScaleFactor: c.dpr,
    hasTouch: c.touch,
    isMobile: c.touch,
  });

  for (const r of ROTALAR) {
    const slug = r === "/" ? "anasayfa" : r.replace(/\//g, "-").slice(1);

    /* `networkidle2` BURADA ASLA GERÇEKLEŞMİYOR: sahnedeki 3D mühür
       (three.js) sürekli istek/bağlantı tuttuğu için ağ hiç "boşa" düşmüyor
       ve 30sn Navigation timeout oluyordu. Bu bir site hatası DEĞİL, bir
       bekleme stratejisi hatasıydı.
       Doğru sıra: DOM hazır → yazı tipleri → reveal animasyonları. */
    await page.goto("http://localhost:3000" + r, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.evaluate(() => document.fonts.ready);
    /* 3D sahne + reveal kırpma animasyonları (0.9s) */
    await new Promise((k) => setTimeout(k, 1800));

    /* Hero / ilk ekran */
    await page.screenshot({
      path: `shots/final/${c.ad}-${slug}-hero.png`,
    });

    /* footer */
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await new Promise((k) => setTimeout(k, 800));
    await page.screenshot({
      path: `shots/final/${c.ad}-${slug}-footer.png`,
    });
    ciz(`  ${c.ad} ${r} ✓`);
  }
}

await browser.close();
ciz("bitti — shots/final/");
process.exit(0);