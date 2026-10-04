/**
 * qa-console.mjs — uygulama konsolu temiz mi?
 *
 * "Unchecked runtime.lastError: A listener indicated an asynchronous
 *  response..." ve "Uncaught (in promise) Error: A listener..." iletileri
 *  için KAYNAK tayini yapar:
 *
 *   1. Temiz headless Chrome'da (uzantı YOK, profil YOK) sayfaları gezer ve
 *      `pageerror` + `console` "error" olaylarını SADECE UYGULAMA bağlamında
 *      dinler. Uzantı yoktur, bu yüzden burada görünen her hata UYGULAMADIR.
 *   2. Ayrıca `chrome.runtime` / `runtime.lastError` kullanımını sayfa
 *      bağlamında sorar: `typeof chrome` normal bir web sayfasında
 *      "undefined" olmalıdır. Uygulama kodunda zaten 0 eşleşme var (kaynak
 *      taraması). Bu, ikinci bağımsız kanıttır.
 *
 * Yan ürün: tam bağlantı denetimi (§23). Her kritik bağlantı gerçekten
 * çözülüyor mu, harici hedefler doğru mu — tek koşuda iki rapor.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const NL = String.fromCharCode(10);
const OUT = "qa-console.log";
const say = (s) => { appendFileSync(OUT, s + NL); console.log(s); };
appendFileSync(OUT, "=== qa-console " + new Date().toISOString() + " ===" + NL);

const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--incognito", "--disable-extensions", "--disable-component-extensions-with-background-pages"],
});
const page = await browser.newPage();
page.setDefaultTimeout(30000);

/* --- YALNIZCA uygulama bağlamı: uzantı yok, profil yok --- */
const pageErrors = [];
const consoleErrors = [];
const failedReqs = [];
page.on("pageerror", (e) => pageErrors.push("pageerror: " + String(e && e.message || e).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push("console.error: " + m.text().slice(0, 200));
});
page.on("requestfailed", (r) => failedReqs.push("FAILED " + r.url().slice(0, 100) + " :: " + (r.failure() && r.failure().errorText)));

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
for (const path of ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"]) {
  try {
    await page.goto(ORIGIN + path, { waitUntil: "load", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    const hid = await page.evaluate(() => {
      return document.querySelectorAll("[data-nextjs-toast], nextjs-portal").length;
    });
    say("  sayfa " + path + " yuklendi (hidrasyon gostergesi=" + hid + ")");
  } catch (e) {
    say("  HATA " + path + " " + String(e.message).slice(0, 120));
  }
}

/* --- chrome.runtime sayfa baglaminda var mi? (olmamali) --- */
const ext = await page.evaluate(() => ({
  chromeType: typeof window.chrome,
  runtimeType: typeof (window.chrome && window.chrome.runtime),
  hasLastError: Boolean(window.chrome && window.chrome.runtime && window.chrome.runtime.lastError),
}));
say("  window.chrome=" + ext.chromeType + " runtime=" + ext.runtimeType + " lastError=" + ext.hasLastError);

say("--- pageerror (" + pageErrors.length + ") ---");
pageErrors.forEach((e) => say("  " + e));
say("--- console.error (" + consoleErrors.length + ") ---");
consoleErrors.forEach((e) => say("  " + e));
say("--- requestfailed (" + failedReqs.length + ") ---");
failedReqs.forEach((e) => say("  " + e));

/* ================= BAĞLANTI DENETİMİ (§23) ================= */
say("=== BAGLANTILAR ===");
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));

const EXPECT = [
  ["logo", "a[aria-label*='ana sayfa']", "/"],
  ["Calismalar", "a", "/work"],
  ["Hizmetler", "a", "/#hizmetler"],
  ["Yaklasim", "a", "/#yaklasim"],
  ["Hakkimizda", "a", "/about"],
  ["CTA mailto", "a[href^='mailto:']", "mailto:muhur.studio@gmail.com"],
  ["WhatsApp FAB", "a.wa-fab", "https://wa.me/905399542171"],
  ["Instagram", null, "https://www.instagram.com/muhur.studio/"],
  ["LinkedIn", null, "https://www.linkedin.com/in/muhurstudio"],
];
const dom = await page.evaluate(() => {
  const all = [...document.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  return all;
});
for (const [ad, sel, beklenen] of EXPECT) {
  let bul = dom.find((h) => h === beklenen);
  if (!bul && sel) {
    const el = await page.$(sel).catch(() => null);
    if (el) bul = await page.evaluate((e) => e.getAttribute("href"), el);
  }
  say("  " + (bul === beklenen ? "ok   " : "BOZUK") + " " + ad + " -> " + (bul || "(yok)") + (bul === beklenen ? "" : "  BEKLENEN=" + beklenen));
}

/* --- dahili hedefler gercekten cozuluyor mu (200) --- */
const targets = ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about", "/#hizmetler", "/#yaklasim"];
for (const t of targets) {
  const clean = t.split("#")[0];
  try {
    const res = await page.goto(ORIGIN + clean, { waitUntil: "domcontentloaded", timeout: 30000 });
    say("  " + (res && res.status() === 200 ? "ok   " : "BOZUK") + " GET " + t + " -> " + (res && res.status()));
  } catch (e) {
    say("  HATA GET " + t + " " + String(e.message).slice(0, 100));
  }
}
say("BITTI");
await browser.close();
process.exit(0);
