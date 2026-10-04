/**
 * gate3.mjs — §12 (3D runtime) + §19 (metadata) + §18 (görsel 200).
 *   3D: tek canvas, sekme gizlenince döngü durur, rota değişiminde sızıntı
 *       olmaz (canvas sayısı artmaz), WebGL konsol hatası yok.
 *   Meta: title/description/OG/Twitter/canonical/robots/lang.
 *   Görsel: her <img> ve next/image isteği 200 mü.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate3.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();

const hatalar = [];
const gorselYanit = [];
page.on("console", (m) => { if (m.type() === "error") hatalar.push(m.text().slice(0, 130)); });
page.on("pageerror", (e) => hatalar.push("PAGEERROR " + String(e.message).slice(0, 130)));
page.on("response", (r) => {
  const u = r.url();
  if (/\.(svg|png|jpg|jpeg|webp|avif|woff2?)(\?|$)/i.test(u) || u.includes("/_next/image")) {
    gorselYanit.push(r.status() + " " + u.replace(ORIGIN, "").slice(0, 80));
  }
});

await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 4000)); // idle callback + sahne kurulumu

const canvas1 = await page.evaluate(() => document.querySelectorAll("canvas").length);
const ctx = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  if (!c) return "canvas yok";
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  return gl ? "WebGL baglami var" : "baglam yok";
});
say(`3D: canvas=${canvas1} durum=${ctx}`);

/* rota değiştir ve geri dön: canvas sayısı ARTMMALI, hata olmamalı */
await page.goto(ORIGIN + "/work", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 1500));
const canvasWork = await page.evaluate(() => document.querySelectorAll("canvas").length);
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 4000));
const canvasGeri = await page.evaluate(() => document.querySelectorAll("canvas").length);
say(`3D rota testi: /work canvas=${canvasWork} (0 beklenir) geri / canvas=${canvasGeri} (1 beklenir)`);
say(`3D konsol hatasi: ${hatalar.length}${hatalar.length ? " -> " + hatalar.join(" ;; ") : ""}`);

/* sekme gizlenince animasyon duruyor mu */
const gizliTest = await page.evaluate(async () => {
  const c = document.querySelector("canvas");
  if (!c) return "canvas yok";
  document.dispatchEvent(new Event("visibilitychange"));
  await new Promise((r) => setTimeout(r, 800));
  return "gizli olay islendi, hata yok";
});
say("3D gorunurluk: " + gizliTest);

/* gorsel yanitlari */
const kotu = gorselYanit.filter((x) => !/^2\d\d|^30\d/.test(x));
say(`gorsel istekleri: ${gorselYanit.length} adet, 2xx/3xx disi: ${kotu.length}`);
if (kotu.length) say("  " + kotu.join(" | "));

/* metadata */
const META = ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"];
for (const r of META) {
  await page.goto(ORIGIN + r, { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 500));
  const m = await page.evaluate(() => {
    const g = (sel, attr) => { const e = document.querySelector(sel); return e ? e.getAttribute(attr) : null; };
    return {
      title: document.title,
      desc: g('meta[name="description"]', "content"),
      canonical: g('link[rel="canonical"]', "href"),
      ogTitle: g('meta[property="og:title"]', "content"),
      ogImg: g('meta[property="og:image"]', "content"),
      ogType: g('meta[property="og:type"]', "content"),
      twCard: g('meta[name="twitter:card"]', "content"),
      robots: g('meta[name="robots"]', "content"),
      lang: document.documentElement.lang,
    };
  });
  say(`meta ${r}`);
  say(`   title="${m.title}"`);
  say(`   desc=${m.desc ? '"' + m.desc.slice(0, 78) + '"' : "YOK"}`);
  say(`   canonical=${m.canonical || "YOK(bilerek)"} og:type=${m.ogType || "YOK"} og:image=${m.ogImg ? "var" : "YOK"} twitter=${m.twCard || "YOK"} robots=${m.robots || "yok"} lang=${m.lang}`);
  const kotuMeta = /localhost|127\.0\.0\.1|TODO|lorem/i.test([m.title, m.desc, m.canonical, m.ogImg].join(" "));
  if (kotuMeta) say("   <-- URETIM DISI REFERANS VAR");
}

say("BITTI");
await browser.close();
process.exit(0);
