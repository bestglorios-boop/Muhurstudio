/**
 * qa2.mjs — FINAL GO-LIVE denetim paketi, bolum 1: konsol + metin + baglanti.
 * (§12-§17 §24 §28 §40 §42 §43)
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const NL = String.fromCharCode(10);
const OUT = "qa2.log";
const say = (s) => { appendFileSync(OUT, s + NL); };
say("=== qa2 " + new Date().toISOString() + " ===");

const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({
  executablePath: chrome, headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--incognito", "--disable-extensions"],
});
const page = await browser.newPage();
page.setDefaultTimeout(30000);

const pageErrors = [];
const consoleErrors = [];
const warnings = [];
const failedReqs = [];
page.on("pageerror", (e) => pageErrors.push("pageerror: " + String((e && e.message) || e).slice(0, 220)));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push("console.error: " + m.text().slice(0, 220));
  else if (m.type() === "warning") warnings.push("console.warn: " + m.text().slice(0, 160));
});
page.on("requestfailed", (r) => failedReqs.push("FAILED " + r.url().slice(0, 110) + " :: " + ((r.failure() && r.failure().errorText) || "?")));
page.on("response", (r) => {
  if (r.status() >= 400 && r.url().indexOf("wa.me") < 0) failedReqs.push("HTTP" + r.status() + " " + r.url().slice(0, 110));
});

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
for (const p of ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about", "/olmayan-sayfa-xyz"]) {
  try {
    const res = await page.goto(ORIGIN + p, { waitUntil: "load", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1800));
    say("sayfa " + p + " -> " + (res && res.status()));
  } catch (e) { say("HATA " + p + " " + String(e.message).slice(0, 100)); }
}
say("A pageerror(" + pageErrors.length + "): " + (pageErrors[0] || "yok"));
pageErrors.slice(1).forEach((e) => say("  " + e));
say("A console.error(" + consoleErrors.length + "): " + (consoleErrors[0] || "yok"));
consoleErrors.slice(1).forEach((e) => say("  " + e));
say("A requestfailed(" + failedReqs.length + "): " + (failedReqs[0] || "yok"));
failedReqs.slice(1).forEach((e) => say("  " + e));
const clockWarn = warnings.filter((w) => /Clock|Timer|deprecat/i.test(w));
say("A three-Clock uyarisi(" + clockWarn.length + "): " + (clockWarn[0] || "yok"));

/* ---------- B. metin denetimi (§12-§14, §42) ---------- */
const INGLIZCE = ["Live Demo", "Get Started", "Read More", "Learn More", "See All", "All Projects", "Back to", "Next Project", "Previous Project", "Send Message", "Your Name", "Your Email"];
const YASAK_IDDIA = ["müşterilerimiz", "referanslarımız", "dönüşüm oranı", "testimonial", "case study", "vaka çalışması"];
for (const p of ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"]) {
  await page.goto(ORIGIN + p, { waitUntil: "load", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  const txt = await page.evaluate(() => document.body.innerText);
  const bul = [];
  for (const w of INGLIZCE) { const re = new RegExp("\\b" + w + "\\b"); if (re.test(txt)) bul.push("EN:" + w); }
  const alt = txt.toLocaleLowerCase("tr");
  for (const w of YASAK_IDDIA) { if (alt.indexOf(w.toLocaleLowerCase("tr")) >= 0) bul.push("IDDA:" + w); }
  say("metin " + p + " -> " + (bul.length ? bul.join(" | ") : "temiz"));
}
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 800));
const hamYol = await page.evaluate(() => {
  const out = [];
  const hepsi = document.querySelectorAll("#iletisim a, footer a");
  hepsi.forEach((a) => {
    const g = (a.textContent || "").trim();
    if (/^\/in\//.test(g)) out.push("HAMYOL:" + g);
  });
  return out;
});
say("ham-yol gorunurluk -> " + (hamYol.length ? hamYol.join(" | ") : "temiz"));


/* ---------- C. baglanti + CTA ---------- */
const baglar = await page.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.getAttribute("href") || ""));
const bekle = {
  "logo/": "/", "calisma": "/work", "hizmet": "/#hizmetler", "yaklasim": "/#yaklasim",
  "hakkimizda": "/about", "cta": "https://wa.me/905399542171", "fab": "https://wa.me/905399542171",
  "eposta": "mailto:muhur.studio@gmail.com", "ig": "https://www.instagram.com/muhur.studio/",
  "li": "https://www.linkedin.com/in/muhurstudio",
};
for (const [ad, h] of Object.entries(bekle)) {
  say("bag " + ad + " -> " + (baglar.indexOf(h) >= 0 ? "ok" : "BOZUK(" + h + " yok)"));
}
const ctaMailto = await page.evaluate(() =>
  [...document.querySelectorAll("a")].filter((a) => (a.textContent || "").trim() === "Proje Başlatalım").map((a) => a.getAttribute("href"))
);
say("cta-hedefleri(" + ctaMailto.length + ") -> " + (ctaMailto.every((h) => h === "https://wa.me/905399542171") ? "HEPSI-WHATSAPP ok" : "BOZUK " + ctaMailto.join(",")));
for (const t of ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"]) {
  const res = await page.goto(ORIGIN + t, { waitUntil: "domcontentloaded", timeout: 30000 });
  say("GET " + t + " -> " + (res && res.status()));
}
{
  const res = await page.goto(ORIGIN + "/olmayan-sayfa-xyz", { waitUntil: "load", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  const ev = await page.evaluate(() => !!document.querySelector('a[href="/"]'));
  say("404 -> status=" + (res && res.status()) + " ana-sayfa-bag=" + (ev ? "ok" : "BOZUK"));

/* ---------- D. mobil menu (§19) ---------- */
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));
await page.tap('button[aria-controls="mobil-menu"]');
await new Promise((r) => setTimeout(r, 600));
const menuAcik = await page.evaluate(() => !!document.querySelector("#mobil-menu"));
const fabOrtuk = await page.evaluate(() => {
  const a = document.querySelector("a.wa-fab");
  const r = a.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return (el === a || a.contains(el)) ? "gorunur" : ("ortuk:" + el.tagName);
});
const bagVar = await page.evaluate(() => !!document.querySelector('#mobil-menu a[href="/work"]'));
await page.evaluate(() => { const l = document.querySelector('#mobil-menu a[href="/work"]'); if (l) l.click(); });
await new Promise((r) => setTimeout(r, 1500));
const menuKapandi = await page.evaluate(() => !document.querySelector("#mobil-menu"));
const fabSonra = await page.evaluate(() => {
  const a = document.querySelector("a.wa-fab");
  if (!a) return "BOZUK:yok";
  const r = a.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return (el === a || a.contains(el)) ? ("gorunur " + Math.round(r.right) + "/" + Math.round(r.bottom)) : "BOZUK:ortuk";
});
say("menu acik=" + menuAcik + " menu-acikken-fab=" + fabOrtuk + " work-bag=" + bagVar + " tik-sonrasi-kapandi=" + menuKapandi + " fab-sonra=" + fabSonra);

/* ---------- E. responsive tarama (§20 §41) ---------- */
const GENIS = [320, 360, 375, 390, 414, 430, 480, 600, 768, 820, 900, 1024, 1280, 1366, 1440, 1536, 1600, 1920];
for (const w of GENIS) {
  const h = w < 600 ? 800 : 900;
  try {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
    await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 900));
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const fab = document.querySelector("a.wa-fab");
      const fr = fab.getBoundingClientRect();
      const el = document.elementFromPoint(fr.left + fr.width / 2, fr.top + fr.height / 2);
      return {
        tasman: de.scrollWidth - de.clientWidth,
        fab: Math.round(fr.width) + "x" + Math.round(fr.height),
        gorunur: (el === fab || fab.contains(el)) && fr.right <= innerWidth + 0.5 && fr.bottom <= innerHeight + 0.5,
        ust: el ? el.tagName : "NULL",
      };
    });
    const kotu = [];
    if (r.tasman > 1) kotu.push("TASMA+" + r.tasman + "px");
    if (!r.gorunur) kotu.push("FAB-GORUNMEZ(" + r.ust + ")");
    say("resp " + w + " -> fab=" + r.fab + " " + (kotu.length ? "BOZUK " + kotu.join("|") : "ok"));
  } catch (e) { say("resp " + w + " HATA " + String(e.message).slice(0, 80)); }
}

/* ---------- F. zoom (§21) ---------- */
for (const z of [1, 1.25, 1.5, 2]) {
  try {
    await page.setViewport({ width: Math.round(1440 / z), height: Math.round(900 / z), deviceScaleFactor: 1 });
    await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 900));
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const fab = document.querySelector("a.wa-fab");
      const fr = fab.getBoundingClientRect();
      return { tasman: de.scrollWidth - de.clientWidth, fab: Math.round(fr.width) + "x" + Math.round(fr.height), sag: Math.round(fr.right) + "/" + innerWidth };
    });
    say("zoom %" + Math.round(z * 100) + " -> fab=" + r.fab + " sag=" + r.sag + (r.tasman > 1 ? " BOZUK TASMA+" + r.tasman : " ok"));
  } catch (e) { say("zoom " + z + " HATA " + String(e.message).slice(0, 80)); }
}
say("BITTI");
await browser.close();
process.exit(0);

}
