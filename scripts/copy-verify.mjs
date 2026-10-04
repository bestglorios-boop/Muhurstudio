/**
 * copy-verify.mjs — §2 metin denetimi, SUNUCUDAN GELEN HTML üzerinde.
 * 7 düzeltilmiş dize CANLI olmalı; eski dizeler HİÇBİR yerde olmamalı.
 */
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const SAYFALAR = ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"];
const metinler = {};
for (const r of SAYFALAR) {
  await page.goto(ORIGIN + r, { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 900));
  metinler[r] = await page.evaluate(() => {
    const t = document.body.innerText;
    const ozel = [...document.querySelectorAll("[aria-label],[alt],[title]")]
      .map((e) => e.getAttribute("aria-label") + " " + e.getAttribute("alt") + " " + e.getAttribute("title")).join(" ");
    return t + " " + ozel;
  });
}
const hepsi = Object.values(metinler).join("\n");

const YENI = [
  ["daha az projeye, daha fazla özen ayırıyoruz.", "Intro gövdesi"],
  ["İzi kalan işler.", "Seçili işler başlığı"],
];
const ESKI = [
  "bir avuç projeye",
  "Yalnızca iz bırakan işler",
  "Kanıtlanmış işler",
  "Seçili İşler",
];

console.log("--- YENI DIZELER (canli HTML'de olmali) ---");
for (const [s, ad] of YENI) {
  const n = hepsi.split(s).length - 1;
  console.log(`  ${n > 0 ? "OK   " : "EKSIK"} ${ad}: "${s}" -> ${n} kez`);
}
console.log("--- ESKI DIZELER (0 olmali) ---");
for (const s of ESKI) {
  const n = hepsi.split(s).length - 1;
  console.log(`  ${n === 0 ? "OK   " : "STALE"} "${s}" -> ${n} kez`);
}

/* Yaklaşım 01-05 gövdeleri: gerçekten render edilmiş ve anlamlı mı */
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 1200));
const yaklasim = await page.evaluate(() => {
  const bolum = document.querySelector("#yaklasim");
  if (!bolum) return { hata: "#yaklasim yok" };
  const ps = [...bolum.querySelectorAll("p")].map((p) => (p.innerText || "").replace(/\s+/g, " ").trim()).filter((s) => s.length > 40);
  return { adet: ps.length, govdeler: ps };
});
console.log("--- YAKLASIM gövdeleri ---");
console.log("  uzun paragraf sayisi: " + yaklasim.adet);
(yaklasim.govdeler || []).forEach((g, i) => console.log(`  ${i + 1}. (${g.length} karakter) ${g.slice(0, 96)}...`));

/* Sayfa sayfa okunabilirlik: her sayfanın başlık akışı */
console.log("--- SAYFA BAŞLIK AKIŞI (okuma sırası) ---");
for (const r of SAYFALAR) {
  await page.goto(ORIGIN + r, { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 700));
  const h = await page.evaluate(() => [...document.querySelectorAll("h1,h2")].map((e) => e.tagName + ": " + (e.innerText || "").replace(/\s+/g, " ").trim().slice(0, 46)));
  console.log(`  ${r}`);
  h.forEach((x) => console.log("    " + x));
}
await browser.close();
process.exit(0);
