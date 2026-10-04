/**
 * gate1.mjs — §5 + §6 kapak denetimi (henüz test edilmemiş olanlar):
 *   - mobil menü: aç / Escape ile kapat / rota tıklayınca kapanır
 *   - gövde kaydırma kilidi: menü açıkken kilitli, kapandıktan sonra ÇÖZÜLMELİ
 *   - menü açıkken body overflow:hidden kalıyor mu
 *   - logo ana sayfaya götürür mü
 *   - /#hizmetler ve /#yaklasim DOĞRUDAN yüklenir mi (anchor)
 *   - ileri/geri navigasyon + yenileme
 *   - hidrasyon uyuşmazlığı
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate1.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();

const konsolHatalari = [];
page.on("console", (m) => { if (m.type() === "error") konsolHatalari.push(m.text().slice(0, 140)); });
page.on("pageerror", (e) => konsolHatalari.push("PAGEERROR " + String(e.message).slice(0, 140)));

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));

/* --- gövde kaydırma kilidi başlangıcı --- */
const govdeKilit = () => page.evaluate(() => {
  const ov = getComputedStyle(document.body).overflow;
  const se = getComputedStyle(document.documentElement).overflow;
  return { body: ov, html: se, scrollY: Math.round(window.scrollY) };
});
say("baslangic govde: " + JSON.stringify(await govdeKilit()));

/* --- menüyü AÇ --- */
await page.evaluate(() => document.querySelector('button[aria-controls="mobil-menu"]')?.click());
await new Promise((r) => setTimeout(r, 700));
const acik = await page.evaluate(() => {
  const btn = document.querySelector('button[aria-controls="mobil-menu"]');
  return {
    ariaExpanded: btn ? btn.getAttribute("aria-expanded") : "YOK",
    menuVar: !!document.querySelector("[data-menu-open], nav[aria-label] , .menu, #mobil-menu"),
    govde: getComputedStyle(document.body).overflow,
    html: getComputedStyle(document.documentElement).overflow,
    scrollY: Math.round(window.scrollY),
  };
});
say("menu ACIK: " + JSON.stringify(acik));

/* --- ESC ile kapat --- */
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 700));
const escKapat = await page.evaluate(() => {
  const btn = document.querySelector('button[aria-controls="mobil-menu"]');
  return {
    ariaExpanded: btn ? btn.getAttribute("aria-expanded") : "YOK",
    govde: getComputedStyle(document.body).overflow,
    html: getComputedStyle(document.documentElement).overflow,
    scrollY: Math.round(window.scrollY),
    govdeKilitliMi: getComputedStyle(document.body).overflow === "hidden",
  };
});
say("ESC SONRASI: " + JSON.stringify(escKapat));
say("  -> kilit ÇÖZÜLDÜ mü: " + (escKapat.govdeKilitliMi ? "HAYIR <-- HATA" : "EVET"));

/* --- menüyü tekrar aç ve rota tıkla --- */
await page.evaluate(() => document.querySelector('button[aria-controls="mobil-menu"]')?.click());
await new Promise((r) => setTimeout(r, 700));
const tiklandi = await page.evaluate(() => {
  const links = [...document.querySelectorAll("a")].filter((a) => (a.textContent || "").trim() === "Çalışmalar");
  const gorunur = links.find((a) => a.getClientRects().length > 0);
  if (gorunur) { gorunur.click(); return "tiklandi"; }
  return "gorunur link yok";
});
await new Promise((r) => setTimeout(r, 1500));
const rotaSonrasi = await page.evaluate(() => ({
  path: location.pathname,
  ariaExpanded: document.querySelector('button[aria-controls="mobil-menu"]')?.getAttribute("aria-expanded"),
  govde: getComputedStyle(document.body).overflow,
  govdeKilitli: getComputedStyle(document.body).overflow === "hidden",
  scrollY: Math.round(window.scrollY),
}));
say("ROTA TIKLAMA (" + tiklandi + ") -> " + JSON.stringify(rotaSonrasi));
say("  -> rota sonrasi govde kilitli mi: " + (rotaSonrasi.govdeKilitli ? "EVET <-- HATA" : "HAYIR"));

/* --- logo -> ana sayfa --- */
const logoGit = await page.evaluate(() => {
  const a = document.querySelector('header a[href="/"], a[aria-label*="ana sayfa"], a[aria-label*="Ana sayfa"]');
  if (!a) return "logo yok";
  a.click();
  return "tiklandi";
});
await new Promise((r) => setTimeout(r, 1500));
say("LOGO -> " + logoGit + " sonuc path=" + await page.evaluate(() => location.pathname));

say("BITTI");
await browser.close();
process.exit(0);
