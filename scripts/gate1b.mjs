/**
 * gate1b.mjs — mobil menü içindeki GERÇEK bağlantıları döker ve
 * tıklama sonrası menünün kapanıp kapanmadığını + kaydırma kilidinin
 * çözülüp çözülmediğini ölçer.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate1b.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1400));

await page.evaluate(() => document.querySelector('button[aria-controls="mobil-menu"]').click());
await new Promise((r) => setTimeout(r, 600));

const menuLinkleri = await page.evaluate(() => {
  const m = document.querySelector("#mobil-menu");
  if (!m) return { hata: "menu yok" };
  return {
    sayi: m.querySelectorAll("a").length,
    linkler: [...m.querySelectorAll("a")].map((a) => ({
      metin: (a.textContent || "").replace(/\s+/g, " ").trim(),
      href: a.getAttribute("href"),
    })),
    butonlar: [...m.querySelectorAll("button")].length,
  };
});
say("menu icerigi: " + JSON.stringify(menuLinkleri, null, 1));

/* İlk rota baglantisina (Çalışmalar) tıkla */
const tik = await page.evaluate(() => {
  const m = document.querySelector("#mobil-menu");
  const a = [...m.querySelectorAll("a")].find((x) => /Çalışmalar/.test(x.textContent || ""));
  if (!a) return "bulunamadi";
  a.click();
  return "tiklandi:" + a.getAttribute("href");
});
await new Promise((r) => setTimeout(r, 1600));
const sonuc = await page.evaluate(() => ({
  path: location.pathname,
  menuDomda: !!document.querySelector("#mobil-menu"),
  ariaExpanded: document.querySelector('button[aria-controls="mobil-menu"]')?.getAttribute("aria-expanded"),
  govdeOverflow: getComputedStyle(document.body).overflow,
  kilitli: getComputedStyle(document.body).overflow === "hidden",
  fabGorunur: !!document.querySelector("a.wa-fab")?.getClientRects().length,
}));
say("tik: " + tik);
say("sonuc: " + JSON.stringify(sonuc));
say("  -> menu kapandi mi: " + (sonuc.menuDomda ? "HAYIR <-- HATA" : "EVET"));
say("  -> kaydirma kilidi cozuldu mu: " + (sonuc.kilitli ? "HAYIR <-- HATA" : "EVET"));
say("  -> FAB geri geldi mi: " + (sonuc.fabGorunur ? "EVET" : "HAYIR <-- HATA"));

/* Ayrıca Çalışmalar rotasından geri dönüş (history) */
await page.goBack({ waitUntil: "load" });
await new Promise((r) => setTimeout(r, 1200));
say("geri donus path=" + await page.evaluate(() => location.pathname));
await page.goForward({ waitUntil: "load" });
await new Promise((r) => setTimeout(r, 1200));
say("ileri path=" + await page.evaluate(() => location.pathname));

/* Yenileme */
await page.reload({ waitUntil: "load" });
await new Promise((r) => setTimeout(r, 1200));
say("yenileme sonrasi path=" + await page.evaluate(() => location.pathname) + " h1=" + await page.evaluate(() => document.querySelectorAll("h1").length));

say("BITTI");
await browser.close();
process.exit(0);
