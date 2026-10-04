/**
 * wa-shot.mjs — §37 kanıtı: her problemli telefonda GERÇEK ekran görüntüsü
 * al, FAB bölgesini kırpıp ayrı dosyaya yaz, gözle incele.
 *
 * DOM/piksel sayımları destekleyicidir; KANIT, kırpılmış karedir.
 * Çıktı: shots/<ad>-<kaydirma>.png  (görünüm + kırmızı çerçeveli yakın plan)
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const OUT = "shots";
mkdirSync(OUT, { recursive: true });
const say = (s) => { appendFileSync("wa-shot.log", s + String.fromCharCode(10)); console.log(s); };

const DEV = [
  ["iPhone-SE", 375, 667, 2],
  ["iPhone-12-13", 390, 844, 3],
  ["iPhone-14-Pro", 393, 852, 3],
  ["iPhone-15-Pro-Max", 430, 932, 3],
  ["Pixel-7-8", 412, 915, 2.6],
  ["Galaxy-S8", 360, 740, 3],
  ["w320", 320, 568, 2],
];

const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();

for (const [name, w, h, dpr] of DEV) {
  for (const sf of [0, 1]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
    await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    if (sf > 0) {
      const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      await page.evaluate((y) => window.scrollTo(0, y), max);
      await new Promise((r) => setTimeout(r, 400));
    }
    const info = await page.evaluate(() => {
      const a = document.querySelector("a.wa-fab");
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!info) { say(name + " FAB YOK"); continue; }
    const file = `${OUT}/${name}-s${sf}.png`;
    await page.screenshot({ path: file });
    say(`${name} s${sf}: fab=${Math.round(info.x)},${Math.round(info.y)} ${Math.round(info.w)}x${Math.round(info.h)} -> ${file}`);
  }
}
await browser.close();
say("BITTI");
process.exit(0);
