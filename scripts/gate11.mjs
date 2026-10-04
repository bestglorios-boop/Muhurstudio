/**
 * gate11.mjs — FAB, ana CTA'nın ÜZERİNE BİNİYOR MU?
 *
 * Sabit WhatsApp düğmesi elbette içeriğin üstünde durur; asıl soru, birincil
 * eylemi (Proje Başlatalım / Çalışmaları Gör) kapatıp kapatmadığıdır.
 * Yağışma oranı: kesişen alan / her iki öğenin alanı ayrı ayrı.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate11.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });

const OLC = [
  ["Galaxy-S8", 360, 740],
  ["iPhone-12/13", 390, 844],
  ["iPhone-15-Pro-Max", 430, 932],
  ["w320", 320, 568],
  ["tablet-768", 768, 1024],
  ["masaustu-1440", 1440, 900],
];

for (const [ad, w, h] of OLC) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 1800));

  for (const etiket of ["enUst", "ctaYayili"]) {
    if (etiket === "ctaYayili") {
      /* CTA'lar görünür olana dek kaydır (ana sayfanın ilk bölümü) */
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise((k) => setTimeout(k, 400));
    }
    const o = await page.evaluate(() => {
      const fab = document.querySelector("a.wa-fab");
      if (!fab) return { fab: "YOK" };
      const f = fab.getBoundingClientRect();
      const ctalar = [...document.querySelectorAll("a")].filter((a) => /wa\.me|whatsapp/i.test(a.getAttribute("href") || ""));
      const rapor = ctalar.map((a) => {
        const r = a.getBoundingClientRect();
        const gx = Math.max(0, Math.min(f.right, r.right) - Math.max(f.left, r.left));
        const gy = Math.max(0, Math.min(f.bottom, r.bottom) - Math.max(f.top, r.top));
        const kesisim = gx * gy;
        const alan = r.width * r.height;
        return {
          yazi: (a.innerText || "").replace(/\s+/g, " ").trim().slice(0, 22),
          gorunur: r.width > 1 && r.height > 1,
          oran: alan ? Math.round((kesisim / alan) * 100) : 0,
          kesismePx: Math.round(kesisim),
          ctaYon: r.width > 0 && r.height > 0 ? { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null,
          fabYon: { l: Math.round(f.left), t: Math.round(f.top), w: Math.round(f.width), h: Math.round(f.height) },
        };
      });
      return { fab: "var", rapor };
    });
    if (o.fab === "YOK") { say(`${ad} ${etiket}: FAB YOK <-- SORUN`); continue; }
    for (const r of o.rapor) {
      if (!r.gorunur) continue;
      say(`${ad} ${etiket}: "${r.yazi}" -> kesisim=${r.kesismePx}px2 (${r.oran}%) fab=${JSON.stringify(r.fabYon)} cta=${JSON.stringify(r.ctaYon)}`);
      if (r.oran > 0) say(`   <-- KESISIM VAR, CTA'nin %${r.oran}'i kapali`);
    }
  }
  await page.close();
}
say("BITTI");
await browser.close();
process.exit(0);
