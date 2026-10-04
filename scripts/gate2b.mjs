/**
 * gate2b.mjs — §13 dokunma hedefi boyutları, DOKUNMATİK bağlamda.
 * globals.css `@media (pointer: coarse)` altında a.tap / a.hairline
 * bağlantılarına 12px dikey dolgu verir. gate2 masaüstü işaretçiyle
 * ölçtüğü için o kural devrede değildi. Burada hasTouch=true ile
 * ölçülür: gerçek telefonda kullanıcının parmağına düşen alan.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate2b.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

for (const r of ["/", "/work", "/work/notella", "/about"]) {
  await page.goto(ORIGIN + r, { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 1200));
  const y = await page.evaluate(() => {
    const hepsi = [...document.querySelectorAll("a, button")].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 1 && b.height > 1 && !el.closest("#mobil-menu");
    });
    const kucuk = hepsi
      .filter((el) => el.getBoundingClientRect().height < 44)
      .map((el) => {
        const b = el.getBoundingClientRect();
        return (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 24) + " (" + Math.round(b.width) + "x" + Math.round(b.height) + ")";
      });
    return { pointer: matchMedia("(pointer: coarse)").matches, toplam: hepsi.length, kucuk };
  });
  say(`${r} coarse=${y.pointer} hedefSayisi=${y.toplam} 44pxAlti=${y.kucuk.length}`);
  if (y.kucuk.length) say("   " + y.kucuk.join(" | "));
}

/* Menü açıkken ölç (menü bağlantıları menü içinde büyük olmalı) */
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 1000));
await page.evaluate(() => document.querySelector('button[aria-controls="mobil-menu"]').click());
await new Promise((k) => setTimeout(k, 600));
const menu = await page.evaluate(() => {
  const m = document.querySelector("#mobil-menu");
  return [...m.querySelectorAll("a")].map((a) => {
    const b = a.getBoundingClientRect();
    return (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 22) + " (" + Math.round(b.width) + "x" + Math.round(b.height) + ")";
  });
});
say("menu baglantilari: " + menu.join(" | "));

say("BITTI");
await browser.close();
process.exit(0);
