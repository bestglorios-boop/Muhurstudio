/**
 * collide.mjs — FAB, hangi etkileşimli örtüşüyor?
 * §20 "CTA collisions" + §41. Tahmin yok: iki dikdörtgenin kesişim ALANI
 * piksel cinsinden ölçülür. 0 olmayan her satır gerçek çakışmadır.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("collide.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();

const CASES = [
  [320, 568], [320, 480], [320, 800], [360, 640], [375, 667],
  [390, 844], [414, 896], [430, 932], [768, 400],
];
for (const [w, h] of CASES) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1000));
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (const sf of [0, 0.15, 0.3, 0.6, 1]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(max * sf));
    await new Promise((r) => setTimeout(r, 250));
    const r = await page.evaluate(() => {
      const fab = document.querySelector("a.wa-fab");
      const f = fab.getBoundingClientRect();
      const hedefler = [];
      document.querySelectorAll("a, button").forEach((el) => {
        if (el === fab || fab.contains(el)) return;
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return;
        const ox = Math.max(0, Math.min(f.right, b.right) - Math.max(f.left, b.left));
        const oy = Math.max(0, Math.min(f.bottom, b.bottom) - Math.max(f.top, b.top));
        if (ox > 0 && oy > 0) {
          hedefler.push({
            t: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 28),
            alan: Math.round(ox * oy), w: Math.round(ox), h: Math.round(oy),
          });
        }
      });
      return hedefler;
    });
    const ad = r.length ? r.map((x) => `"${x.t}" ${x.w}x${x.h}=${x.alan}px2`).join(" | ") : "temiz";
    say(`${w}x${h} @${sf} -> ${r.length ? "CARPISMA " : ""}${ad}`);
  }
}
say("BITTI");
await browser.close();
process.exit(0);
