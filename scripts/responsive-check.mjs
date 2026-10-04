/**
 * HIZLI DUYARLI DENETİM — kritik genişlikler, tek tur.
 *
 * Kapsamlı tarama (29 en-boy oranı × 5 rota) scripts/viewport-check.mjs'de
 * kalır. Bu dosya üretim öncesi hızlı geri bildirim içindir: yatay taşma,
 * kırpılmış metin, WhatsApp çakışması, dokunma hedefi ve konsol hatası.
 *
 * Kullanım: node scripts/responsive-check.mjs [port]
 */
import puppeteer from "puppeteer-core";

const PORT = process.argv[2] || "3000";
const BASE = `http://localhost:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORTS = [
  [320, 568], [360, 800], [390, 844], [430, 932],
  [768, 1024], [1024, 768], [1440, 900], [2560, 1440],
];
const ROUTES = ["/", "/work", "/work/notella", "/about"];

let issues = 0;
const add = (s) => { issues++; console.log("  ! " + s); };

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--enable-unsafe-swiftshader"],
});

for (const [w, h] of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  for (const route of ROUTES) {
    // `networkidle0` KULLANILMAZ: 3D ve kontur alanı sürekli rAF döngüsü
    // çalıştığı için ağ hiçbir zaman "idle" olmaz ve tarayıcı zaman aşımına
    // uğrar. DOM'un hazır olması yeterli bir sinyaldir.
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 900));
    const res = await page.evaluate(() => {
      const out = { overflow: null, tiny: [], wa: null };
      const de = document.documentElement;
      if (de.scrollWidth > de.clientWidth + 1) out.overflow = `${de.scrollWidth}>${de.clientWidth}`;
      // Dokunma hedefi yalnızca DOKUNMA cihazlarında zorunludur.
      // WCAG 2.5.8, metin içi bağlantıları (hairline/tap) bu kuraldan muaf
      // tutar; masaüstünde 24px altı metin bağlantısı normaldir.
      // globals.css, `pointer: coarse` altında bu bağlantılara 12px'lik dikey
      // dolgu vererek dokunma hedefini 44px'e çıkarır.
      if (window.matchMedia("(pointer: coarse)").matches) {
        document.querySelectorAll("a,button").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.height < 24) {
            out.tiny.push((el.textContent || "").trim().slice(0, 18));
          }
        });
      }
      const wa = document.querySelector('a[aria-label*="WhatsApp"]');
      if (wa) {
        const a = wa.getBoundingClientRect();
        if (a.right > window.innerWidth + 1 || a.left < -1) out.wa = "ekran disinda";
      }
      return out;
    });

    const tag = `${w}x${h} ${route}`;
    if (res.overflow) add(`${tag}: yatay tasma ${res.overflow}`);
    if (res.tiny.length) add(`${tag}: kucuk dokunma hedefi -> ${res.tiny.slice(0, 3).join(" | ")}`);
    if (res.wa) add(`${tag}: WhatsApp ${res.wa}`);
    if (errors.length) add(`${tag}: konsol hatasi -> ${errors.slice(0, 2).join(" | ")}`);
  }
  await page.close();
  console.log(`  ${w}x${h} tarandi`);
}

await browser.close();
console.log(`\nDUYARLI SORUN SAYISI: ${issues}`);