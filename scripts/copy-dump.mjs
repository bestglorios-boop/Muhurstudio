/**
 * copy-dump.mjs — §12/§42 için TUM gorunur metni sayfa sayfa döker.
 * Okunup denetlenir: doğal Türkçe, noktalama, İngilizce arayüz sızıntısı,
 * ham yol/yol benzeri metin, gerçekçi olmayan iddia.
 */
import puppeteer from "puppeteer-core";
import { existsSync, writeFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

let out = "";
for (const p of ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about", "/olmayan-sayfa-xyz"]) {
  await page.goto(ORIGIN + p, { waitUntil: "load", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));
  const r = await page.evaluate(() => {
    const gizle = (el) => [...el.querySelectorAll("[hidden], .sr-only")];
    const metin = document.body.innerText;
    const altlar = [...document.querySelectorAll("img")].map((i) => (i.getAttribute("alt") || "ALT-YOK").slice(0, 70));
    const butonAdlari = [...document.querySelectorAll("button")].map((b) => (b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 40));
    return { metin, altlar, butonAdlari, gizli: gizle(document.body).length };
  });
  out += "\n================ " + p + " ================\n" + r.metin;
  out += "\n[img alt] " + (r.altlar.join(" || ") || "img yok") + "\n";
  out += "[button] " + (r.butonAdlari.join(" || ") || "yok") + "\n";
}
writeFileSync("copy.txt", out, "utf8");
console.log("yazildi copy.txt (" + out.length + " karakter)");
await browser.close();
process.exit(0);
